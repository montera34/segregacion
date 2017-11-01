//Prepare canvas size
isMobile = innerWidth < 768;

var screenwidth = d3.select("#vis").node().clientWidth;

// set the dimensions and margins of the graph
// Margin convention: https://bl.ocks.org/mbostock/3019563
var margin = {top: 50, right: 10, bottom: 10, left:0},
    width = (isMobile ? (screenwidth*3) : screenwidth) - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var vis = d3.select("#vis");
var chartWidth = width/9;

// sets scales
var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var svg = d3.select("#vis").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("+ margin.left +"," + margin.top + ")");
    
var tooltip = d3.select("body").append("div") 
		.attr("class", "tooltip2")

d3.tsv("data/segregacion-escuela-euskadi_simple.tsv", function(error, zonas) {

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(zonas[0]).filter(function(d) {
    return d != "zona" && (y[d] = d3.scale.linear()
        .domain(d3.extent(zonas, function(p) { return +p[d]; }))
        .range([height, 0]));
  }));

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(zonas)
    .enter().append("path")
      .attr("d", path)
      .attr("fill","none")
    	.attr("class",function(d) { return d.zona;} );
			
  // Add foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(zonas)
    .enter().append("path")
      .attr("d", path)
      .attr("class",function(d) { return d.zona + " "+ d.provincia;} ) // colorea líneas según color de provincia
      .attr("stroke", function(d) { return d.provincia == "araba" ? "#f6ae01" : d.provincia == "gipuzkoa" ? "#4199cb" : d.provincia == "bizkaia" ? "#da5455" : "#666"; })
      .attr("fill","none")
      .attr("id",function(d) { return d.zona;} ) // colorea líneas según color de provincia
      .on("mousemove", showTooltip) // AÑADIR EVENTO SHOW TOOLTIP
			.on("mouseout", hideTooltip); // OCULTAR TOOLTIP

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return {x: x(d)}; })
        .on("dragstart", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) { return position(a) - position(b); });
          x.domain(dimensions);
          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        })
        .on("dragend", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
              .attr("d", path)
            .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);
        }));

	// Add rectangles to hide not interesting paths
  g.append("rect")
		.attr("y", 0 )
		.attr("height", height)
		.attr("x", 0)
		.attr("width", chartWidth)
		.attr("fill","#FFFFFF")
		.attr("class", function(d) { return d; });

  // Add an axis and title.
  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("class","axis_title")
      .attr("y", -9)
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

  // rótulos secciones
	svg.append("text")
		.attr("x", chartWidth)
		.attr("y", -margin.top/2)
		.text("% becas Material escolar")
		.attr("class", "axistitle")
		.style("text-anchor", "middle")
		.attr("font-size", "14px")
		.attr("fill", "black")
		.attr("font-weight", "bold");
	svg.append("text")
		.attr("x", chartWidth*3)
		.attr("y", -margin.top/2)
		.text("% becas comedor")
		.attr("class", "axistitle")
		.style("text-anchor", "middle")
		.attr("font-size", "14px")
		.attr("fill", "black")
		.attr("font-weight", "bold");
	svg.append("text")
		.attr("x", chartWidth*5)
		.attr("y", -margin.top/2)
		.text("% extranjeros")
		.attr("class", "axistitle")
		.style("text-anchor", "middle")
		.attr("font-size", "14px")
		.attr("fill", "black")
		.attr("font-weight", "bold");

	// rótulos ejes
	svg.append("text")
		.attr("x", chartWidth/2)
		.attr("y", -margin.top/6)
		.text("Público")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth+chartWidth/2)
		.attr("y", -margin.top/6)
		.text("Privado-concertado")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth/2+chartWidth*2)
		.attr("y", -margin.top/6)
		.text("Público")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth+chartWidth/2+chartWidth*2)
		.attr("y", -margin.top/6)
		.text("Privado-concertado")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth/2+chartWidth*4)
		.attr("y", -margin.top/6)
		.text("Público")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth+chartWidth/2+chartWidth*4)
		.attr("y", -margin.top/6)
		.text("Privado-concertado")
		.attr("class","axis_label");
	function showTooltip(d) {
		// Fill the tooltip
		tooltip.html(
			"<div class='table-responsive'><h5><strong>" + d.zona + "</strong> (Alumnado: " + d.total_alumnado + ", " + d.provincia + ", zona " + d.zona_id + ")</h5>" +
					"<table class='table table-condensed table-striped'><thead><tr><td></td><td>Público</td><td>Concertado-Privado</td></tr></thead>" +
					"<tbody><tr><td>% Becas material escolar</td><td style='text-align:right'>" + d.perc_bec_mat_escolar_pub + "% </td><td style='text-align:right'>" + d.perc_bec_mat_escolar_priv + "% </td></tr>" +
					"<tr><td>% Becas comedor</td><td style='text-align:right'>" + d.perc_bec_comedor_pub + "% </td><td style='text-align:right'>" + d.perc_bec_comedor_priv + "% </td></tr>" +
					"<tr><td>% Extranjeros</td><td style='text-align:right'>" + d.perc_alum_ext_pub + "% </td><td style='text-align:right'>" + d.perc_alum_ext_priv + "% </td></tr></	tbody>" +
			"</table></div>")
			.style("opacity", 1)

		tooltip.style("left", (d3.event.pageX)+55 + "px")
		tooltip.style("top", (d3.event.pageY)-155 + "px")
	}

	function hideTooltip(d) {
		// Hide tooltip
		tooltip.style("opacity", 0)
	}
});

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}
