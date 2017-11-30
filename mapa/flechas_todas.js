// cartograma basado en original de https://martingonzalez.net/

//Prepare canvas size
isMobile = innerWidth < 758;

var screenwidth = d3.select("#cartogram").node().clientWidth;

var margin = {top: 0, right: 0, bottom: 0, left: 0},
    //width = (isMobile ? (screenwidth+100) : screenwidth) - margin.left - margin.right,
    width = 1100 - margin.left - margin.right,
    ratio = 1,
    height = width*ratio - margin.top - margin.bottom,
    margen = 14,
    padding = 3;
var square = 67

// Rectangle size
//must calculate manually the relationship of the squares of this values to match the min and max value ofthe domains
// first value is the minimum size of square side, and the second the maximun size of square side
var rectSize = d3.scaleSqrt()
    .range([5, 100])

// Line size
var lineSize = d3.scaleLinear()
		.domain([0,72])
    .range([0,square-margen])
var lineSizeBeca = d3.scaleLinear()
		.domain([0,72])
    .range([0,square-margen])

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
var colorTot= d3.scaleLinear()
    .domain([1, 19])
    .range(['#fff','#555'])

// Adds cartogram svg
var svg = d3.select("#cartogram").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("+ margin.left +"," + margin.top + ")");

//Adds Background image
var background = svg.append('g').attr('id','backgroundimage');
background.append("image")
	.attr("xlink:href", "../images/leyenda-flechas-segregacion-todas-red-pub-priv-euskadi.png")
	.attr("x", width-500)
	.attr("y", -80)
	.attr("width", "400")
	.attr("height", "311");

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

defs.append("marker")
	.attr("id","markerCircle")
	.attr("refX",2)
	.attr("refY",2)
	.attr("markerWidth",4)
	.attr("markerHeight",4)
	.attr("orient","auto")
	.append("circle")
		.attr("class","circleHead")
		.attr("fill-opacity","1")
		.attr("fill","#bd0017")
		.attr("stroke","none")
		.attr("cx",2)
		.attr("cy",2)
		.attr("r",0.8)

defs.append("marker")
	.attr("id","markerCirclePriv")
	.attr("refX",2)
	.attr("refY",2)
	.attr("markerWidth",4)
	.attr("markerHeight",4)
	.attr("orient","auto")
	.append("circle")
		.attr("class","circleHead")
		.attr("fill-opacity","1")
		.attr("fill","#00F")
		.attr("stroke","none")
		.attr("cx",2)
		.attr("cy",2)
		.attr("r",0.8)

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
        d.area = square / 1
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
        .attr("transform", function(d) { return "translate(" + (d.x - square/2) + "," + d.y + ")" })
          .on("mousemove", showTooltip) // AÑADIR EVENTO SHOW TOOLTIP
					.on("mouseout", hideTooltip) // OCULTAR TOOLTIP
		
		// Becas Material escolar
		arrows.append("line")
		  .each(function(d) {
		  		var desigualdad = (d.properties.indice_desigualdad == null ) ? 0 : d.properties.indice_desigualdad;
		  		if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
		  			value = 0;
		  		}
		      d3.select(this)
		        .attr("width", square)
		        .attr("height", square)
		        .attr("x1", lineSizeBeca(d.properties.perc_bec_mat_escolar_pub))
		        .attr("y1", - square/2 + 25)
		        .attr("x2", lineSizeBeca(d.properties.perc_bec_mat_escolar_priv))
		        .attr("y2", - square/2 + 25)
		        .attr("marker-end", function(d) {
				      if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
							endMarker = "";
							} else { endMarker = "url(#markerCirclePriv)" }
				      return endMarker;
				      }
		        )
		        .attr("marker-start","url(#markerCircle)")
		        .attr("fill","#bd0017")
		        .attr("stroke-opacity","0.7")
		        .attr("stroke", function(d) {
		          var desigualdad = (d.properties.indice_desigualdad == null ) ? "--" : d.properties.indice_desigualdad;
							if  ( desigualdad == "--" ) {
								desigualdad = "--";
								color = "#EEE";
							} else if ( (d.properties.perc_bec_mat_escolar_pub - d.properties.perc_bec_mat_escolar_priv) > 0 ) {
								desigualdad = d.properties.indice_desigualdad;
								color = "#bd0017";
							} else {
								desigualdad = d.properties.indice_desigualdad;
								color = "#00F";
							}
		      		return color;
		        })
		        .attr("stroke-width", 4)
		      })

		// Becas comedor
		arrows.append("line")
		  .each(function(d) {
		  		var desigualdad = (d.properties.indice_desigualdad == null ) ? 0 : d.properties.indice_desigualdad;
		  		if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
		  			value = 0;
		  		}
		      d3.select(this)
		        .attr("width", square)
		        .attr("height", square)
		        .attr("x1", lineSizeBeca(d.properties.perc_bec_comedor_pub))
		        .attr("y1", - square/2 + 45)
		        .attr("x2", lineSizeBeca(d.properties.perc_bec_comedor_priv))
		        .attr("y2", - square/2 + 45)
		        .attr("marker-end", function(d) {
				      if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
							endMarker = "";
							} else { endMarker = "url(#markerCirclePriv)" }
				      return endMarker;
				      }
		        )
		        .attr("marker-start","url(#markerCircle)")
		        .attr("fill","#bd0017")
		        .attr("stroke-opacity","0.7")
		        .attr("stroke", function(d) {
		          var desigualdad = (d.properties.indice_desigualdad == null ) ? "--" : d.properties.indice_desigualdad;
							if  ( desigualdad == "--" ) {
								desigualdad = "--";
								color = "#EEE";
							} else if ( (d.properties.perc_bec_comedor_pub - d.properties.perc_bec_comedor_priv) > 0 ) {
								desigualdad = d.properties.indice_desigualdad;
								color = "#bd0017";
							} else {
								desigualdad = d.properties.indice_desigualdad;
								color = "#00F";
							}
		      		return color;
		        })
		        .attr("stroke-width", 4)
		      })
		// Extranjeros
		arrows.append("line")
		  .each(function(d) {
		  		var desigualdad = (d.properties.indice_desigualdad == null ) ? 0 : d.properties.indice_desigualdad;
		  		if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
		  			value = 0;
		  		}
		      d3.select(this)
		        .attr("width", square)
		        .attr("height", square)
		        .attr("x1", lineSize(d.properties.perc_alum_ext_publi))
		        .attr("y1", 30)
		        .attr("x2",lineSize(d.properties.perc_alum_ext_priv))
		        .attr("y2", 30)
		        .attr("class", Math.abs(d.properties.perc_alum_ext_publi - d.properties.perc_alum_ext_priv))
		        .attr("marker-end", function(d) {
				      if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
							endMarker = "";
							} else { endMarker = "url(#markerCirclePriv)" }
				      return endMarker;
				      }
		        )
		        .attr("marker-start","url(#markerCircle)")
		        .attr("fill","#bd0017")
		        .attr("stroke-opacity","0.7")
		        .attr("stroke", function(d) {
		          var desigualdad = (d.properties.indice_desigualdad == null ) ? "--" : d.properties.indice_desigualdad;
							if  ( desigualdad == "--" ) {
								desigualdad = "--";
								color = "#EEE";
							} else if ( desigualdad > 1 ) {
								desigualdad = d.properties.indice_desigualdad;
								color = "#bd0017";
							} else {
								desigualdad = d.properties.indice_desigualdad;
								color = "#00F";
							}
		      		return color;
		        })
		        .attr("stroke-width", 4)
		      })
  rect.append("rect")
        .each(function(d) {
            d3.select(this)
              .attr("width", d.area)
              .attr("height", d.area)
              .attr("x", -square / 2)
              .attr("y", -square / 2)
              //.attr("x", -d.area / 2)
              //.attr("y", -d.area / 2)
              /*.attr("fill", function(d) {
		            if  ( d.properties.indice_desigualdad == null)  {
									return "#CCC";
								} else {
									return colorTot(d.properties.perc_alum_ext_todos)
								}
							})*/
							.attr("fill", "#eee")
              .attr("stroke", "#fff")
              .attr("stroke-width", 1)
              .attr("rx", 0.7)
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
		// Texto de zona
		arrows.append("text")
			.each(function(d) {
			//var zona = ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) ? " " : d.properties.zona;
			d3.select(this)
				.attr("text-anchor", "left")
				.attr("dy", -square/2 + 14)
				.attr("dx", "4px")
				.text( function(d) {
					var punto = (d.properties.zona.length > 10)? "." : "";
					return d.properties.zona.substring(0,10) + punto;
					})
				.style("fill", "black")
				.style("font-size", "13px")
				.attr("pointer-events","none");
		})

		// texto diferencia 1: Material escolar
    arrows.append("text")
      .each(function(d) {
				var zona = ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) ? " " : d.properties.zona;
        d3.select(this)
          .attr("text-anchor", "end")
		      .attr("dy", - square/2 + 29)
		      .attr("dx", square)
		      .text(
		      function(d) {
				      if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
								texto = "";
							} else { 
								texto = 
									d3.format(",.0f")(d.properties.perc_bec_mat_escolar_pub - d.properties.perc_bec_mat_escolar_priv)
							}
				      return texto;
				      }
		      )
		      .style("fill", function(d) {
						var priv = (d.properties.perc_bec_mat_escolar_priv == null ) ? 0 : d.properties.perc_bec_mat_escolar_priv;
						var pub = (d.properties.perc_bec_mat_escolar_pub == null ) ? 0 : d.properties.perc_bec_mat_escolar_pub;
						var colora = ((pub - priv) > 0 ) ? "#bd0017" : "blue";
						return colora;
						}
		      )
		      .style("font-size", "10px")
		      })
		// texto diferencia 2
    arrows.append("text")
      .each(function(d) {
				var zona = ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) ? " " : d.properties.zona;
        d3.select(this)
          .attr("text-anchor", "end")
		      .attr("dy", - square/2 + 49)
		      .attr("dx", square)
		      .text(
		      function(d) {
				      if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
								texto = "";
							} else { 
								texto = 
									d3.format(",.0f")(d.properties.perc_bec_comedor_pub - d.properties.perc_bec_comedor_priv)
							}
				      return texto;
				      }
		      )
		      .style("fill", function(d) {
						var priv = (d.properties.perc_bec_comedor_priv == null ) ? 0 : d.properties.perc_bec_comedor_priv;
						var pub = (d.properties.perc_bec_comedor_pub == null ) ? 0 : d.properties.perc_bec_comedor_pub;
						var colora = ((pub - priv) > 0 ) ? "#bd0017" : "blue";
						return colora;
						}
		      )
		      .style("font-size", "10px")
		      })
		// texto diferencia 3: extranjero
    arrows.append("text")
      .each(function(d) {
				var zona = ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) ? " " : d.properties.zona;
        d3.select(this)
          .attr("text-anchor", "end")
		      .attr("dy", 34)
		      .attr("dx", square)
		      .text(
		      function(d) {
				      if ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) {
								texto = "";
							} else { 
								texto = 
									d3.format(",.0f")(d.properties.perc_alum_ext_publi - d.properties.perc_alum_ext_priv)
							}
				      return texto;
				      }
		      )
		      .style("fill", function(d) {
						var desigualdad = (d.properties.indice_desigualdad == null ) ? 0 : d.properties.indice_desigualdad;
						var colora = ( desigualdad > 1 ) ? "#bd0017" : "blue";
						return colora;
						}
		      )
		      .style("font-size", "10px")
		      })
		// % de red pública
/*    arrows.append("text")
      .each(function(d) {
				var zona = ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) ? " " : d.properties.zona;
        d3.select(this)
          .attr("text-anchor", "left")
		      .attr("dy", 30)
		      .attr("dx", lineSize(d.properties.perc_alum_ext_publi) + 4)
		      .text(d.properties.perc_alum_ext_publi + "%")
		      .style("fill", "red")
		      .style("font-size", "11px")
      })
		// % de red privada
    arrows.append("text")
      .each(function(d) {
				var zona = ( d.properties.zona == "Igorre" || d.properties.zona == "Montaña alavesa" || d.properties.zona == "Basurto-Zorroza" ) ? " " : d.properties.zona;
        d3.select(this)
          .attr("text-anchor", "right")
		      .attr("dy", 30)
		      .attr("dx", lineSize(d.properties.perc_alum_ext_priv) - 12)
		      .text(d3.format(",.0f")(d.properties.perc_alum_ext_priv))
		      .style("fill", "blue")
		      .style("font-size", "11px")
      })
*/

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
						color = "rgb(189,0,23,0.4)";
					} else {
						desigualdad = d3.format(",.2f")(d.properties.perc_alum_ext_priv / d.properties.perc_alum_ext_publi )
						diferencia = d3.format(",.1f")(d.properties.perc_alum_ext_priv - d.properties.perc_alum_ext_publi)
						diferencia_explica = "% privada - % pública";
						cociente = "% privada / % pública";
						color = "rgb(0,0,255,0.4)";
					}
        
          var privado = (d.properties.perc_alum_ext_priv == null ) ? "-- " : d.properties.perc_alum_ext_priv;

          tooltip.html("<div class='table-responsive'><strong>" + d.properties.zona + "</strong> (zona escolar " + d.properties.zona_id2 + ", " + d.properties.provincia + ")</div>" +
            "<table class='table table-condensed'>" +
               "<tr>" +
                    "<td style='text-align:right;color:#bd0017'><strong>"+ d.properties.perc_bec_mat_escolar_pub  +"%</strong></td><td>alumnado becado material escolar en la red <strong>pública</strong></td>" +
                "</tr>" +
                 "<tr>" +
                    "<td style='text-align:right;color:#00F'><strong>"+ d.properties.perc_bec_mat_escolar_priv +"%</strong></td><td>alumnado becado material escolar en la red <strong>privado-concertada</strong></td>" +
                "</tr>" +
                "<tr>" +
                    "<td style='text-align:right;color:#bd0017'><strong>"+ d.properties.perc_bec_comedor_pub  +"%</strong></td><td>alumnado becado comedor en la red <strong>pública</strong></td>" +
                "</tr>" +
                 "<tr>" +
                    "<td style='text-align:right;color:#00F'><strong>"+ d.properties.perc_bec_comedor_priv +"%</strong></td><td>alumnado becado comedor en la red <strong>privado-concertada</strong></td>" +
                "</tr>" +
                "<tr>" +
                    "<td style='text-align:right;color:#bd0017'><strong>"+ d.properties.perc_alum_ext_publi  +"%</strong></td><td>alumnado es extranjero en la red <strong>pública</strong></td>" +
                "</tr>" +
                 "<tr>" +
                    "<td style='text-align:right;color:#00F'><strong>"+ privado +"%</strong></td><td>alumnado es extranjero en la red <strong>privado-concertada</strong></td>" +
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
