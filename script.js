var margin = {left:80, top:40, right:120, bottom:50},
	width = 800,
    height = 550,
    innerRadius = Math.min(width * 0.33, height * .45),
    outerRadius = innerRadius * 1.05;
	
//Recalculate the width and height now that we know the radius
width = outerRadius * 2 + margin.right + margin.left;
height = outerRadius * 2 + margin.top + margin.bottom;
	
//Reset the overall font size
var newFontSize = Math.min(70, Math.max(40, innerRadius * 62.5 / 250));
d3.select("html").style("font-size", newFontSize + "%");

////////////////////////////////////////////////////////////
////////////////// Set-up Chord parameters /////////////////
////////////////////////////////////////////////////////////
	
var pullOutSize = 20 + 30/135 * innerRadius;
var numFormat = d3.format(",.0f");
var defaultOpacity = 0.85,
	fadeOpacity = 0.075;
						
var loom = d3.loom()
    .padAngle(0.05)
	//.sortSubgroups(sortAlpha)
	//.heightInner(28)
	.emptyPerc(0.2)
	.widthInner(30)
	//.widthInner(function(d) { return 6 * d.length; })
	.value(function(d) { return d.deaths; })
	.inner(function(d) { return d.country; })
	.outer(function(d) { return d.disease; });

var arc = d3.arc()
    .innerRadius(innerRadius*1.01)
    .outerRadius(outerRadius);

var string = d3.string()
    .radius(innerRadius)
	.pullout(pullOutSize);

////////////////////////////////////////////////////////////
//////////////////// country notes ///////////////////////
////////////////////////////////////////////////////////////
	
var countries = [];
countries["India"] = "India is covering almost the major part of the chart and major being in Diarrhoea. They should really work on their sanitations.";
countries["China"] = "China is on second number of the chart although not far behind from India with major parts in Liver cancer and road injuries. ";
countries["Indonesia"] = "There is nothing specific about Indonesia as it is covering a small part in all types of diseases. The should work on strengthing their hospitals and hygiene.";
countries["Brazil"] = "Brazil is covering a small pat in many type of diseases but they should ore focus on how they can avoid road accidents and other things that are causing high number of road accidents in the country.";
countries["Canada"] = "Canada is holding it tight and have very small parts in major type of diseases.";
countries["Russia"] = "Russia being the largest country is still holding a small portions in all type of diseases, there is always a chance of improvement.";
countries["USA"] = "USA is having some small parts in all the type of diseases, they should work on how they can improve this and make a zero record.";
countries["Nigeria"] = "Nigeria is facing majority of its death from Malaria. they should really take care of the mosquitoes that are making home in their country.";
countries["Australia"] = "Australia is holding very small part in the chart, they are looking really focused on the part, they should keep it up.";
countries["South Africa"] = "Covering a major part of AIDS, South Africa should really focus how they can decerease that number as it is totally possible to at least take some precautions to avoid this.";

////////////////////////////////////////////////////////////
////////////////////// Create SVG //////////////////////////
////////////////////////////////////////////////////////////
			
var svg = d3.select("#lotr-chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

////////////////////////////////////////////////////////////
///////////////////// Read in data /////////////////////////
////////////////////////////////////////////////////////////
			
d3.json('health_2016.json', function (error, dataAgg) {

	////////////////////////////////////////////////////////////
	///////////////////// Prepare the data /////////////////////
	////////////////////////////////////////////////////////////
	
	//Sort the inner countrys based on the total number of deaths spoken
	
	//Find the total number of deaths per country
	var dataChar = d3.nest()
		.key(function(d) { return d.country; })
		.rollup(function(leaves) { return d3.sum(leaves, function(d) { return d.deaths; }); })
		.entries(dataAgg)
		.sort(function(a, b){ return d3.descending(a.value, b.value); });				
	//Unflatten the result
	var countryOrder = dataChar.map(function(d) { return d.key; });
	//Sort the countrys on a specific order
	function sortcountry(a, b) {
	  	return countryOrder.indexOf(a) - countryOrder.indexOf(b);
	}//sortcountry
	
	//Set more loom functions
	loom
		.sortSubgroups(sortcountry)
		.heightInner(innerRadius*0.75/countryOrder.length);
	
	////////////////////////////////////////////////////////////
	///////////////////////// Colors ///////////////////////////
	////////////////////////////////////////////////////////////
					
	//Color for the unique diseases
	var diseases = ["Tuberculosis", "AIDS", "Diarrhoea", "Dengue",  "Malaria", "Nutririoal Deficiencies", "Breast Cancer", "Drugs",  "Road Injuries", "Liver Cancer", "Hepatitus B"];
	var colors = ["#5a3511", "#47635f",   "#223e15", "#3C7E16", "#0d1e25",  "#53821a",    "#4387AA",  "#770000", "#373F41", "#602317", "#8D9413"];
	var color = d3.scaleOrdinal()
    	.domain(diseases)
    	.range(colors);
	
	//Create a group that already holds the data
	var g = svg.append("g")
	    .attr("transform", "translate(" + (width/2 + margin.left) + "," + (height/2 + margin.top) + ")")
		.datum(loom(dataAgg));	

	////////////////////////////////////////////////////////////
	///////////////////// Set-up title /////////////////////////
	////////////////////////////////////////////////////////////

	var titles = g.append("g")
		.attr("class", "texts")
		.style("opacity", 0);
		
	titles.append("text")
		.attr("class", "name-title")
		.attr("x", 0)
		.attr("y", -innerRadius*5/6);
		
	titles.append("text")
		.attr("class", "value-title")
		.attr("x", 0)
		.attr("y", -innerRadius*5/6 + 25);
	
	//The country pieces	
	titles.append("text")
		.attr("class", "country-note")
		.attr("x", 0)
		.attr("y", innerRadius/2)
		.attr("dy", "0.35em");
					
	////////////////////////////////////////////////////////////
	////////////////////// Draw outer arcs /////////////////////
	////////////////////////////////////////////////////////////

	var arcs = g.append("g")
	    .attr("class", "arcs")
	  .selectAll("g")
	    .data(function(s) { 
			return s.groups; 
		})
	  .enter().append("g")
		.attr("class", "arc-wrapper")
	  	.each(function(d) { 
			d.pullOutSize = (pullOutSize * ( d.startAngle > Math.PI + 1e-2 ? -1 : 1)) 
		})
 	 	.on("mouseover", function(d) {
			
			//Hide all other arcs	
			d3.selectAll(".arc-wrapper")
		      	.transition()
				.style("opacity", function(s) { return s.outername === d.outername ? 1 : 0.5; });
			
			//Hide all other strings
		    d3.selectAll(".string")
		      	.transition()
		        .style("opacity", function(s) { return s.outer.outername === d.outername ? 1 : fadeOpacity; });
				
			//Find the data for the strings of the hovered over disease
			var diseaseData = loom(dataAgg).filter(function(s) { return s.outer.outername === d.outername; });
			//Hide the countrys who haven't said a death
			d3.selectAll(".inner-label")
		      	.transition()
		        .style("opacity", function(s) {
					//Find out how many deaths the country said at the hovered over disease
					var char = diseaseData.filter(function(c) { return c.outer.innername === s.name; });
					return char.length === 0 ? 0.1 : 1;
				});
 	 	})
     	.on("mouseout", function(d) {
			
			//Sjow all arc labels
			d3.selectAll(".arc-wrapper")
		      	.transition()
				.style("opacity", 1);
			
			//Show all strings again
		    d3.selectAll(".string")
		      	.transition()
		        .style("opacity", defaultOpacity);
				
			//Show all countrys again
			d3.selectAll(".inner-label")
		      	.transition()
		        .style("opacity", 1);
 	 	});

	var outerArcs = arcs.append("path")
		.attr("class", "arc")
	    .style("fill", function(d) { return color(d.outername); })
	    .attr("d", arc)
		.attr("transform", function(d, i) { //Pull the two slices apart
		  	return "translate(" + d.pullOutSize + ',' + 0 + ")";
		 });
		 					
	////////////////////////////////////////////////////////////
	//////////////////// Draw outer labels /////////////////////
	////////////////////////////////////////////////////////////

	//The text needs to be rotated with the offset in the clockwise direction
	var outerLabels = arcs.append("g")
		.each(function(d) { d.angle = ((d.startAngle + d.endAngle) / 2); })
		.attr("class", "outer-labels")
		.attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
		.attr("transform", function(d,i) { 
			var c = arc.centroid(d);
			return "translate(" + (c[0] + d.pullOutSize) + "," + c[1] + ")"
			+ "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
			+ "translate(" + 26 + ",0)"
			+ (d.angle > Math.PI ? "rotate(180)" : "")
		})
		
	//The outer name
	outerLabels.append("text")
		.attr("class", "outer-label")
		.attr("dy", ".35em")
		.text(function(d,i){ return d.outername; });
		
	//The value below it
	outerLabels.append("text")
		.attr("class", "outer-label-value")
		.attr("dy", "1.5em")
		.text(function(d,i){ return numFormat(d.value) + " deaths"; });

	////////////////////////////////////////////////////////////
	////////////////// Draw inner strings //////////////////////
	////////////////////////////////////////////////////////////
	
	var strings = g.append("g")
	    .attr("class", "stringWrapper")
		.style("isolation", "isolate")
	  .selectAll("path")
	    .data(function(strings) { 
			return strings; 
		})
	  .enter().append("path")
		.attr("class", "string")
		.style("mix-blend-mode", "multiply")
	    .attr("d", string)
	    .style("fill", function(d) { return d3.rgb( color(d.outer.outername) ).brighter(0.2) ; })
		.style("opacity", defaultOpacity);
		
	////////////////////////////////////////////////////////////
	//////////////////// Draw inner labels /////////////////////
	////////////////////////////////////////////////////////////
			
	//The text also needs to be displaced in the horizontal directions
	//And also rotated with the offset in the clockwise direction
	var innerLabels = g.append("g")
		.attr("class","inner-labels")
	  .selectAll("text")
	    .data(function(s) { 
			return s.innergroups; 
		})
	  .enter().append("text")
		.attr("class", "inner-label")
		.attr("x", function(d,i) { return d.x; })
		.attr("y", function(d,i) { return d.y; })
		.style("text-anchor", "middle")
		.attr("dy", ".35em")
	    .text(function(d,i) { return d.name; })
 	 	.on("mouseover", function(d) {
			
			//Show all the strings of the highlighted country and hide all else
		    d3.selectAll(".string")
		      	.transition()
		        .style("opacity", function(s) {
					return s.outer.innername !== d.name ? fadeOpacity : 1;
				});
				
			//Update the death count of the outer labels
			var countryData = loom(dataAgg).filter(function(s) { return s.outer.innername === d.name; });
			d3.selectAll(".outer-label-value")
				.text(function(s,i){
					//Find which countryData is the correct one based on disease
					var loc = countryData.filter(function(c) { return c.outer.outername === s.outername; });
					if(loc.length === 0) {
						var value = 0;
					} else {
						var value = loc[0].outer.value;
					}
					return numFormat(value) + (value === 1 ? " death" : " deaths"); 
					
				});
			
			//Hide the arc where the country hasn't said a thing
			d3.selectAll(".arc-wrapper")
		      	.transition()
		        .style("opacity", function(s) {
					//Find which countryData is the correct one based on disease
					var loc = countryData.filter(function(c) { return c.outer.outername === s.outername; });
					return loc.length === 0 ? 0.1 : 1;
				});
					
			//Update the title to show the total death count of the country
			d3.selectAll(".texts")
				.transition()
				.style("opacity", 1);	
			d3.select(".name-title")
				.text(d.name);
			d3.select(".value-title")
				.text(function() {
					var deaths = dataChar.filter(function(s) { return s.key === d.name; });
					return numFormat(deaths[0].value);
				});
				
			//Show the country note
			d3.selectAll(".country-note")
				.text(countries[d.name])
				.call(wrap, 2.25*pullOutSize);
				
		})
     	.on("mouseout", function(d) {
			
			//Put the string opacity back to normal
		    d3.selectAll(".string")
		      	.transition()
				.style("opacity", defaultOpacity);
				
			//Return the death count to what it was
			d3.selectAll(".outer-label-value")	
				.text(function(s,i){ return numFormat(s.value) + " deaths"; });
				
			//Show all arcs again
			d3.selectAll(".arc-wrapper")
		      	.transition()
		        .style("opacity", 1);
			
			//Hide the title
			d3.selectAll(".texts")
				.transition()
				.style("opacity", 0);
			
		});
	  		
});//d3.csv

////////////////////////////////////////////////////////////
///////////////////// Extra functions //////////////////////
////////////////////////////////////////////////////////////

//Sort alphabetically
function sortAlpha(a, b){
	    if(a < b) return -1;
	    if(a > b) return 1;
	    return 0;
}//sortAlpha

//Sort on the number of deaths
function sortdeaths(a, b){
	    if(a.deaths < b.deaths) return -1;
	    if(a.deaths > b.deaths) return 1;
	    return 0;
}//sortdeaths

/*Taken from http://bl.ocks.org/mbostock/7555321
//Wraps SVG text*/
function wrap(text, width) {
  text.each(function() {
	var text = d3.select(this),
		deaths = text.text().split(/\s+/).reverse(),
		death,
		line = [],
		lineNumber = 0,
		lineHeight = 1.2, // ems
		y = parseFloat(text.attr("y")),
		x = parseFloat(text.attr("x")),
		dy = parseFloat(text.attr("dy")),
		tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

	while (death = deaths.pop()) {
	  line.push(death);
	  tspan.text(line.join(" "));
	  if (tspan.node().getComputedTextLength() > width) {
		line.pop();
		tspan.text(line.join(" "));
		line = [death];
		tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(death);
	  }
	}
  });
}//wrap