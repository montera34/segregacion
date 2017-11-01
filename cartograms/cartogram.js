var width = 1000,
    height = 700,
    padding = 2

//var projection = d3.geoConicConformalSpain()
//    .translate([width / 2, height / 2])
//    .scale(3500)

//  .scale(width / 2 / Math.PI)
//  .scale(300)
//  .translate([width / 2, height / 2])

// Rectangle size
var rectSize = d3.scaleSqrt()
    .range([3, 60]) //must calculate manually the relationship of the squares of this values to match the min and max value ofthe domains

// Font size scale
var fontSize = d3.scaleLinear()
    .range([8, 24])

// Party
var color = d3.scaleLinear()
    .domain([0.1, 1, 2.5, 5, 7.5, 44]) // See why 5 values https://github.com/d3/d3-scale#continuous_domain indice_desigualdad
    .range(['#f5b022','#E4F1E1','#9CCDC1','#63A6A0','#337F7F','#0D585F'])

var svg = d3.select("#vis").append("svg")
    .attr("width", width)
    .attr("height", height)

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")

d3.json("limites-zonas-escolares-euskadi-con-variables-2014-15_simplify2.json", function(err, data) { //../data/output/limites-zonas-escolares-euskadi-con-variables-2014-15_simplify2.json
//barrios-pamplona-wgs84-viviendas-poblacion.json
// move projection inside json to be able to get data
var projection = d3.geoMercator()
    .fitSize([width, height], topojson.feature(data, data.objects.	barrios));

var path = d3.geoPath()
    .projection(projection);

    // 1. Features we are painting
    barrio = topojson.feature(data, data.objects.barrios).features

    // Rect size scale
    rectSize.domain(d3.extent(barrio, function(d) {return d.properties.v_alum_ext_total }))

    // 2. Create on each feature the centroid and the positions
    barrio.forEach(function(d) {
        d.pos = projection(d3.geoCentroid(d))
        d.x = d.pos[0]
        d.y = d.pos[1]
        d.area = rectSize(d.properties.v_alum_ext_total) / .6 // Select how to scale the squares. Try and decide
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
    for (var i = 0; i < 120; ++i) simulation.tick()

    // 5. Paint the cartogram
    var rect = svg.selectAll("g")
        .data(barrio)
        .enter()
        .append("g")
        .attr("class", function(d) { return "zona: " + d.properties.zona })
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
              .attr("fill", color(d.properties.v_indice_desigualdad))
              .attr("stroke", "#ccc")
              .attr("rx", 2)
          })

    rect.append("text")
        .each(function(d) {
            d3.select(this)
                .attr("text-anchor", "middle")
                .attr("dy", 12)
                .text(d.properties.zona)
                .style("fill", "black")
                .style("font-size", fontSize(d.area) + "px")
                .style("font-size", "11px")
        })

      function showTooltip(d) {
          // Fill the tooltip
          tooltip.html("<div class='tooltip-city'><strong>" + d.properties.zona + "</strong></div>" +
            "<table class='tooltip-table'>" +
                "<tr class='first-row'>" +
                    "<td><span class='table-n'>"+ d3.format(",.2f")(d.properties.v_indice_desigualdad) +"</span> índice desigualdad extranjeros </td>" +
                "</tr>" +
                "<tr>" +
                    "<td>"+ d.properties.v_alum_ext_total +" total alumnado extranjero</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>"+ d.properties.v_perc_alum_ext_publi +"% alumnado extranjero en red pública</td>" +
                "</tr>" +
                 "<tr>" +
                    "<td>"+ d.properties.v_perc_alum_ext_priv +"% alumnado extranjero en red privado-concertada</td>" +
                "</tr>" +               
              "</table>")
            .style("opacity", 1)

          tooltip.style("left", (d3.event.pageX - 20) + "px")
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
