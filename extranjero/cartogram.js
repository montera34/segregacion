// cartograma basado en original de https://martingonzalez.net/

//Prepare canvas size
isMobile = innerWidth < 758;

var screenwidth = d3.select("#cartogram").node().clientWidth;

var margin = {top: 20, right: 0, bottom: 0, left: 0},
    //width = (isMobile ? (screenwidth+100) : screenwidth) - margin.left - margin.right,
    width = 900 - margin.left - margin.right,
    ratio = 1.02,
    height = width*ratio - margin.top - margin.bottom,
    padding = 2;
var square = 70

// Rectangle size
//must calculate manually the relationship of the squares of this values to match the min and max value ofthe domains
// first value is the minimum size of square side, and the second the maximun size of square side
var rectSize = d3.scaleSqrt()
    .range([5, 100])

// Line size
var lineSize = d3.scaleLinear()
		.domain([0,30])
    .range([0,square*2])

// Font size scale
var fontSize = d3.scaleLinear()
    .range([2,72.94])

// Color
var colorPub = d3.scaleLinear()
    .domain([1, 40])
    .range(['#fff','red'])
var colorPriv = d3.scaleLinear()
    .domain([1, 40])
    .range(['#fff','blue'])

// Adds cartogram svg
var svg = d3.select("#cartogram").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("+ margin.left +"," + margin.top + ")");

//Adds Background image
/*var background = svg.append('g').attr('id','backgroundimage');
background.append("image")
	.attr("xlink:href", "../images/leyenda-segregacion-extranjeros-red-pub-priv-euskadi.png")
	.attr("x", 0)
	.attr("y", height- 361)
	.attr("width", "278")
	.attr("height", "311");
*/
// Adds arrows
defs = svg.append("defs");

defs.append("marker")
	.attr("id","arrow")
	.attr("viewBox","0 -5 10 10")
	.attr("refX",5)
	.attr("refY",0)
	.attr("markerWidth",4)
	.attr("markerHeight",4)
	.attr("orient","auto")
	.append("path")
	.attr("d", "M0,-5L5,0L0,5")
	.attr("class","arrowHead")
	.attr("fill-opacity","0")
	.attr("stroke","grey")

var rectangulos = svg.append('g').attr('id','rectangulos');
var rectangulos2 = svg.append('g').attr('id','rectangulos2');
var flechas = svg.append('g').attr('id','flechas');

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

    // Line size scale
    // lineSize.domain(d3.extent(barrio, function(d) {return d.properties.total_alumnado })) TODO, as there is no "dif" variable for extranjeros

    // 2. Create on each feature the centroid and the positions
    barrio.forEach(function(d) {
        d.pos = projection(d3.geoCentroid(d))
        d.x = d.pos[0]
        d.y = d.pos[1]
        // Select how to scale the squares. Try and decide
       // d.area = rectSize(d.properties.total_alumnado) / 0.75
        d.area = square
        //d.lsize = lineSize(Math.abs(d.properties.perc_alum_ext_publi - d.properties.perc_alum_ext_publi)) no se usa
    })

    // Font size scale
    fontSize.domain(d3.extent(barrio, function(d) {return d.area }))

    // 3. Collide force
    var simulation = d3.forceSimulation(barrio)
        .force("x", d3.forceX(function(d) { return d.pos[0] }).strength(.1))
        .force("y", d3.forceY(function(d) { return d.pos[1] }).strength(.1))
        .force("collide", collide)

    // 4. Number of simulations
    for (var i = 0; i < 100; ++i) simulation.tick()

    // 5. Paint the cartogram
    var rect = rectangulos.selectAll("g")
        .data(barrio)
        .enter()
        .append("g")
        .attr("class", function(d) { return "zona " + d.properties.zona + " z" + d.properties.zona_id })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
          .on("mousemove", showTooltip) // AÑADIR EVENTO SHOW TOOLTIP
					.on("mouseout", hideTooltip) // OCULTAR TOOLTIP

/*    var rect2 = rectangulos2.selectAll("g")
        .data(barrio)
        .enter()
        .append("g")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
          .on("mousemove", showTooltip) // AÑADIR EVENTO SHOW TOOLTIP
					.on("mouseout", hideTooltip) // OCULTAR TOOLTIP
*/		
		var arrows = flechas.selectAll("g")
        .data(barrio)
        .enter()
        .append("g")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })
          .on("mousemove", showTooltip) // AÑADIR EVENTO SHOW TOOLTIP
					.on("mouseout", hideTooltip) // OCULTAR TOOLTIP

		arrows.append("line")
		  .each(function(d) {
		  		var desigualdad = (d.properties.indice_desigualdad == null ) ? 0 : d.properties.indice_desigualdad;
		  		var value = lineSize(Math.abs(d.properties.perc_alum_ext_publi - d.properties.perc_alum_ext_priv));
		  		if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
		  			value = 0;
		  		}
		      d3.select(this)
		        .attr("width", square)
		        .attr("height", square)
		        .attr("x1", 0)
		        .attr("y1", 25)
		        .attr("x2", function(d) { return (desigualdad > 1) ? value : -value; })
		        .attr("y2", 25)
		        .attr("class", Math.abs(d.properties.perc_alum_ext_publi - d.properties.perc_alum_ext_priv))
		        .attr("marker-end","url(#arrow)")
		        .attr("fill","#F00")
		        .attr("stroke", function(d) {
		          var desigualdad = (d.properties.indice_desigualdad == null ) ? "--" : d.properties.indice_desigualdad;
							color = "#000";
							if  ( desigualdad == "--" ) {
								desigualdad = "--";
								color = "#FFF";
							} else if ( desigualdad > 1 ) {
								desigualdad = d.properties.indice_desigualdad;
								color = "#F00";
							} else {
								desigualdad = d.properties.indice_desigualdad;
								color = "#00F";
							}
		      		return color;
		        })
		        .attr("stroke-width", 3);
		      })

  rect.append("rect")
        .each(function(d) {
            d3.select(this)
              .attr("width", d.area)
              .attr("height", d.area)
              .attr("x", -d.area / 2)
              .attr("y", -d.area / 2)
              /*.attr("fill", function(d) {
		            if  ( d.properties.indice_desigualdad == null)  {
									return "#CCC";
								} else {
									return colorPub(d.properties.perc_alum_ext_publi)
								}
							})*/
							.attr("fill", "#FFF")
              .attr("stroke", "#FFF")
              .attr("stroke-width", 1)
              .attr("rx", 0.5)
          })

/*	    rect2.append("rect")
        .each(function(d) {
            d3.select(this)
              .attr("width", d.area)
              .attr("height", d.area)
              .attr("x", -d.area / 2)
              .attr("y", -d.area / 2)
              .attr("fill", function(d) {
		            if  ( d.properties.indice_desigualdad == null)  {
									return "#CCC";
								} else {
									return colorPriv(d.properties.perc_alum_ext_priv)
								}
							})
              .attr("stroke", "#CCC")
              .attr("stroke-width", 1)
              .attr("rx", 0.5)
          })
*/
    arrows.append("text")
        .each(function(d) {
        		var zona = ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) ? " " : d.properties.zona; 
            d3.select(this)
                .attr("text-anchor", "middle")
                .attr("dy", 12)
                .text(zona.substring(0,11)+".")
                .style("fill", "black")
                .style("font-size", "14px")
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
                    "<td style='text-align:right'><strong>"+ d.properties.perc_alum_ext_publi  +"%</strong></td><td>alumnado es extranjero en la red <strong>pública</strong></td>" +
                "</tr>" +
                 "<tr>" +
                    "<td style='text-align:right'><strong>"+ privado +"%</strong></td><td>alumnado es extranjero en la red <strong>privado-concertada</strong></td>" +
                "</tr>" +
								"<tr>" +
                    "<td style='text-align:right'>"+ d.properties.perc_alum_ext_todos +"%</td><td>alumnado es extranjero de media</td>" +
                "</tr>" +
								"<tr>" +
                    "<td style='text-align:right'>"+ diferencia +"</td><td>diferencia % ("+ diferencia_explica + ")</td>" +
                "</tr>" +
                "<tr>" +
                    "<td style='text-align:right'>"+ desigualdad +"</td><td>índice desigualdad extranjeros (" + cociente + ")</td>" +
                "</tr>" +
                "<tr>" +
                    "<td style='text-align:right'>"+ d.properties.alum_ext_total +"</td><td>total alumnado extranjero</td>" +
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
