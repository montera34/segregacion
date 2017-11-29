//Prepare canvas size
isMobile = innerWidth < 758;

var screenwidth = d3.select("#cartogram").node().clientWidth;

var margin = {top: 20, right: 20, bottom: 10, left:10},
    width = (isMobile ? (screenwidth) : screenwidth) - margin.left - margin.right,
    height = 710 - margin.top - margin.bottom,
    padding = 2;

//var projection = d3.geoConicConformalSpain()
//    .translate([width / 2, height / 2])
//    .scale(3500)

//  .scale(width / 2 / Math.PI)
//  .scale(300)
//  .translate([width / 2, height / 2])

// Rectangle size
//must calculate manually the relationship of the squares of this values to match the min and max value ofthe domains
// first value is the minimum size of square side, and the second the maximun size of square side
var rectSize = d3.scaleSqrt()
    .range([5, 43])

// Font size scale
var fontSize = d3.scaleLinear()
    .range([2,72.94])

// Color
var colorPub = d3.scaleLinear()
    .domain([27, 72]) // 28 - 72
    .range(['#fff','red'])
var colorPriv = d3.scaleLinear()
    .domain([27, 72]) // 9 - 70
    .range(['#fff','blue'])

// Adds cartogram svg
var svg = d3.select("#cartogram").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("+ margin.left +"," + margin.top + ")");

//Adds Background image
var background = svg.append('g').attr('id','backgroundimage');
background.append("image")
	.attr("xlink:href", "../images/leyenda-becas-red-pub-priv-euskadi.png")
	.attr("x", 0)
	.attr("y", height- 361)
	.attr("width", "278")
	.attr("height", "311");

var rectangulos = svg.append('g').attr('id','rectangulos');
var rectangulos2 = svg.append('g').attr('id','rectangulos2');

// Adds tooltip
var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")

d3.json("limites-zonas-escolares-euskadi-con-variables-2014-15_simplify2.json", function(err, data) {

// move projection inside json to be able to get data
var projection = d3.geoMercator().fitSize([width, height], topojson.feature(data, data.objects.barrios));

var path = d3.geoPath()
    .projection(projection);

    // 1. Features we are painting
    barrio = topojson.feature(data, data.objects.barrios).features

    // Rect size scale
    rectSize.domain(d3.extent(barrio, function(d) {return d.properties.total_alumnado }))

    // 2. Create on each feature the centroid and the positions
    barrio.forEach(function(d) {
        d.pos = projection(d3.geoCentroid(d))
        d.x = d.pos[0]
        d.y = d.pos[1]
        d.area = rectSize(d.properties.total_alumnado) / 0.65// Select how to scale the squares. Try and decide
      // d.area = rectSize(d.properties.habitantes2015) / 2 // How we scale
    })

    // Font size scale
    fontSize.domain(d3.extent(barrio, function(d) {return d.area }))

    // 3. Collide force
    var simulation = d3.forceSimulation(barrio)
        .force("x", d3.forceX(function(d) { return d.pos[0] }).strength(.1))
        .force("y", d3.forceY(function(d) { return d.pos[1] }).strength(.1))
        .force("collide", collide)

    // 4. Number of simulations
    for (var i = 0; i < 200; ++i) simulation.tick()

    // 5. Paint the cartogram
    var rect = rectangulos.selectAll("g")
        .data(barrio)
        .enter()
        .append("g")
        .attr("class", function(d) { return "zona " + d.properties.zona + " z" + d.properties.zona_id })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })

    var rect2 = rectangulos2.selectAll("g")
        .data(barrio)
        .enter()
        .append("g")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
          .on("mousemove", showTooltip) // AÑADIR EVENTO SHOW TOOLTIP
					.on("mouseout", hideTooltip) // OCULTAR TOOLTIP

    rect.append("rect")
        .each(function(d) {
            d3.select(this)
              .attr("width", d.area)
              .attr("height", d.area)
              .attr("x", -d.area / 2)
              .attr("y", -d.area / 2)
              .attr("fill", function(d) {
		            if  ( d.properties.perc_bec_mat_escolar_priv == null)  {
									return "#EEE";
								} else {
									return colorPub(d.properties.perc_bec_mat_escolar_pub)
								}

								/* Colorea por indice_desigualdad
								} else if  ( d.properties.indice_desigualdad == 44 )  {
									return "#337F7F";
						    } else if ( d.properties.indice_desigualdad > 1 ) {
									return colorPub(d.properties.indice_desigualdad)
								} else {
							 		return colorPriv(d.properties.perc_alum_ext_priv / d.properties.perc_alum_ext_publi)
								}
								*/
							})
              //color(d.properties.indice_desigualdad)
              .attr("stroke", "#EEE")
              .attr("stroke-width", 1)
              .attr("rx", 0.5)
          })

    rect2.append("rect")
        .each(function(d) {
            d3.select(this)
              .attr("width", d.area)
              .attr("height", d.area)
              .attr("x", -d.area / 2)
              .attr("y", -d.area / 2)
              .attr("fill", function(d) {
		            if  ( d.properties.perc_bec_mat_escolar_priv == null)  {
									return "#CCC";
								} else {
									return colorPriv(d.properties.perc_bec_mat_escolar_priv)
								}
							})
              .attr("stroke", "#CCC")
              .attr("stroke-width", 1)
              .attr("rx", 0.5)
          })

    rect.append("text")
        .each(function(d) {
            d3.select(this)
                .attr("text-anchor", "middle")
                .attr("dy", 12)
                .text(d.properties.zona.substring(0,7)+".")
                .style("fill", "black")
                .style("font-size", fontSize(d.area) + "px")
                .style("font-size", "11px")
        })

      function showTooltip(d) {
          // Fill the tooltip
          var desigualdad = (d.properties.indice_desigualdad == null ) ? "--" : d.properties.indice_desigualdad;

					if  ( desigualdad == "--" ) {
						desigualdad = "--";
						cociente = "valor nulo al no haber centros privados concertados";
					} else if ( desigualdad > 1 ) {
						desigualdad = d.properties.indice_desigualdad;
						diferencia = d3.format(",.1f")(d.properties.perc_alum_ext_publi - d.properties.perc_alum_ext_priv);
						diferencia_explica = "% pública - % privada";
						cociente = "% pública / % privada";
					} else {
						desigualdad = d3.format(",.2f")(d.properties.perc_alum_ext_priv / d.properties.perc_alum_ext_publi )
						diferencia = d3.format(",.1f")(d.properties.perc_alum_ext_priv - d.properties.perc_alum_ext_publi)
						diferencia_explica = "% privada - % pública";
						cociente = "% privada / % pública";
					}
        
          var privado = (d.properties.perc_alum_ext_priv == null ) ? "-- " : d.properties.perc_alum_ext_priv;

          tooltip.html("<div class='table-responsive'><strong>" + d.properties.zona + "</strong> (zona escolar " + d.properties.zona_id2 + ")</div>" +
            "<table class='table table-condensed table-striped'>" +
                "<tr>" +
                    "<td style='text-align:right'><strong>"+ d.properties.perc_bec_mat_escolar_pub +"%</strong></td><td>alumnado becado material escolar en la red <strong>pública</strong></td>" +
                "</tr>" +
               "<tr>" +
                    "<td style='text-align:right'><strong>"+ d.properties.perc_bec_mat_escolar_priv +"%</strong></td><td>alumnado becado material escolar en la red <strong>privada</strong></td>" +
                "</tr>" +
               "<tr>" +
                    "<td style='text-align:right'><strong>"+ d.properties.dif_perc_bec_mat_escolar_dif +"</strong></td><td> diferencia pública - privada</td>" +
                "</tr>" +
								"<tr>" +
                    "<td style='text-align:right'>"+ d.properties.total_alumnado +"</td><td> alumnado</td>" +
                "</tr>" +
              "</table>")
            .style("opacity", 1)

          tooltip.style("left", (d3.event.pageX + 20) + "px")
          tooltip.style("top", (d3.event.pageY + 23) + "px")
        }

      function hideTooltip(d) {
        // Hide tooltip
        tooltip.style("opacity", 0)
      }
})

// From http://bl.ocks.org/mbostock/4055889
function collide() {
  for (var k = 0, iterations = 4, strength = 0.5; k < iterations; ++k) {
    for (var i = 0, n = barrio.length; i < n; ++i) {
      for (var a = barrio[i], j = i + 1; j < n; ++j) {
        var b = barrio[j],
            x = a.x + a.vx - b.x - b.vx,
            y = a.y + a.vy - b.y - b.vy,
            lx = Math.abs(x),
            ly = Math.abs(y),
            r = a.area/2 + b.area/2 + padding;
        if (lx < r && ly < r) {
          if (lx > ly) {
            lx = (lx - r) * (x < 0 ? -strength : strength);
            a.vx -= lx, b.vx += lx;
          } else {
            ly = (ly - r) * (y < 0 ? -strength : strength);
            a.vy -= ly, b.vy += ly;
          }
        }
      }
    }
  }
}
