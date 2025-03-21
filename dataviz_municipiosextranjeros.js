//Prepare canvas size
isSmall = innerWidth < 350;
isMobile = innerWidth < 758;

var screenwidth = d3.select("#vis").node().clientWidth;

// set the dimensions and margins of the graph
// Margin convention: https://bl.ocks.org/mbostock/3019563
var margin = {top: 50, right: 10, bottom: 10, left:0},
    width = (isSmall ? (screenwidth*0.5) : screenwidth*1) - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var vis = d3.select("#vis");
var chartWidth = width/6; //change this depending on number of varables

// language
var becasMaterial = "% Becas material escolar",
becasComedor = "% Becas comedor",
alumnadoExtranjero = "% alumnado extranjero",
publico = "público",
privadoConcertado = "privado-concertado";
	
if (lengua == "eu" ) {
  var becasMaterial = "Material didaktikoko beken %",
	becasComedor = "Jantokiko beken %";
	alumnadoExtranjero = "Atzerriko ikasleen %",
	publico = "publikoa",
	privadoConcertado = "pribatu-itunpekoa";
}

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

// set color scale
var colorScale = d3.scale.linear()
    .domain([0, 0.65]) // See why 5 values https://github.com/d3/d3-scale#continuous_domain indice_desigualdad
    .range(['#32f341','#a759e5'])

//replaces spaces and .

var replacement = function(d) { return d.replace(/\s+/g, '').replace(/\.+/g, '').replace(/\,+/g, '').replace(/[{()}]/g, '').replace(/\-+/g, '').toLowerCase();};
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

//Legends
var legend = d3.select("#legend");
var zona = d3.select("#zona");

d3.tsv("data/municipios-diferencias-pub-pri_inf-basica.csv", function(error, zonas) {

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(zonas[0]).filter(function(d) {
    return d != "id" && d != "provincia" && d != "municipio" && d != "alum_pub" && d != "alum_pri" && d != "ext_pri" && d != "ext_pub" && (y[d] = d3.scale.linear() //removes from chart variables
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
      .attr("stroke","#AAA")
			.attr("class",function(d) { return replacement(d.municipio);} );

  // Add foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(zonas)
    .enter().append("path")
      .attr("d", path)
      .attr("class",function(d) { return replacement(d.municipio) + " todas "+ d.provincia;} ) // colorea líneas según color de provincia
      //.attr("stroke", function(d) { return d.provincia == "araba" ? "#f6ae01" : d.provincia == "gipuzkoa" ? "#4199cb" : d.provincia == "bizkaia" ? "#da5455" : "#666"; })
      .attr("stroke", function(d) { return colorScale(d.indice_gorard) })
      .attr("fill","none")
      .attr("stroke-width","1.4px")
      //.attr("stroke-width","2px")
      .attr("id",function(d) { return replacement(d.municipio);} ) // colorea líneas según color de provincia
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
  if ( !isMobile ) { // makes brush only work for non mobile devices
  g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);
	}

  // rótulos secciones
	/*svg.append("text")
		.attr("x", chartWidth/2)
		.attr("y", -margin.top/2)
		.text(alumnadoExtranjero)
		.attr("class", "axistitle")
		.style("text-anchor", "middle")
		.attr("font-size", "14px")
		.attr("fill", "black")
		.attr("font-weight", "bold");*/
	// rótulos ejes
	svg.append("text")
		.attr("x", chartWidth/2)
		.attr("y", -margin.top/6)
		.text(publico)
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth + chartWidth/2)
		.attr("y", -margin.top/6)
		.text(privadoConcertado)
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth/2+chartWidth*2)
		.attr("y", -margin.top/6)
		.text("Nº Alumnado")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth/2+chartWidth*3)
		.attr("y", -margin.top/6)
		.text("Índice de Gorard")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth/2+chartWidth*4)
		.attr("y", -margin.top/6)
		.text("Diferencia: % público - % privado")
		.attr("class","axis_label");
	svg.append("text")
		.attr("x", chartWidth/2+chartWidth*5)
		.attr("y", -margin.top/6)
		.text("Cociente: % público/% privado")
		.attr("class","axis_label");

	function showTooltip(d) {
		// Fill the tooltip
		tooltip.html(
			"<div class='table-responsive'><h5><strong>" + d.municipio + "</strong> (" + capitalizeFirstLetter(d.provincia) + ")</h5>" +
					"<table class='table table-condensed table-striped'><thead><tr><td></td><td>" + publico + "</td><td>" + privadoConcertado + "</td></tr></thead>" +
					"<tbody>" +
					"<tr><td>" + alumnadoExtranjero + "</td><td style='text-align:right'>" + d.per_ext_pub + "% </td><td style='text-align:right'>" + d.per_ext_pri + "% </td></tr>" +
					"<tr><td>" + "Índice de Gorard" + "</td><td style='text-align:center' colspan = '2'>" + d.indice_gorard + "% </td></tr>" +
					"<tr><td>" + "Diferencia: % público - % privado" + "</td><td style='text-align:center' colspan = '2'>" + d.diferencia + "% </td></tr>" +
					"<tr><td>" + "Cociente: % público/% privado" + "</td><td style='text-align:center' colspan = '2'>" + d.cociente + "% </td></tr>" +
			"</	tbody></table></div>")
			.style("opacity", 1)

		tooltip.style("left", (d3.event.pageX)+55 + "px")
		tooltip.style("top", (d3.event.pageY)-255 + "px")
	}

	function hideTooltip(d) {
		// Hide tooltip
		tooltip.style("opacity", 0)
	}

	// Selecciona zona (dropdown menu)
	legend.selectAll('div')
		.data(zonas)
		.enter().append("li").append("a")
		.attr("class", function(d) { return "inactive " + replacement(d.municipio);})
		.attr("id", function(d) { return "id" + replacement(d.municipio);})
		.text(function(d) { return d.municipio;})
		.on('click',function(d) { //when click on name
			legend.select('.btn-activo').attr('class','inactive');
			svg.selectAll('svg .foreground path').style("visibility","hidden").attr("stroke-width","1.1px");
			svg.selectAll('svg .foreground path.'+ replacement(d.municipio))
				.style("opacity",1)
				.style("visibility","visible").attr("stroke-width","0.9px"); //selecciona path que coincide con la zona seleccionada
			d3.select(this).attr("class","btn-activo"); //adds class success to button
			if ( d.zona == "Todas") {
				zona.select("p").html("<strong>Todas las zonas</strong>");
			} else if ( d.perc_alum_ext_priv == "") {
				zona.select("p").html("<strong>"+d.municipio+"</strong>. No hay centros privados en esta zona");
			} else {
				zona.select("p").html("<strong>"+d.municipio+"</strong>."); //write in description
			}
		});
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
