const educationUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
// [
//   {
//   "fips": 1001,
//   "state": "AL",
//   "area_name": "Autauga County",
//   "bachelorOrHigher": 21.9
//   },
// ]
// Note: fips = objects.counties.geometeries.id
// Counties topojson
const countiesUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
// {
// 	"type": "Topology",
// 	"objects": {
// 		"counties": {
// 			"type": "GeometryCollection",
// 			"geometries": [
// 				{
// 					"type": "Polygon",
// 					"id": 5089,
// 					"arcs": [
// 						[
// 							0,
// 							1,
// 							2,
// 							3,
// 							4
// 						]
// 					]
// 				}

// margins, width and height for the svg element
const margin = { top: 20, right: 60, bottom: 80, left: 80 };
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const round = (num) => Math.round(num * 10) / 10;
// titles
const title = "United States Educational Attainment";
const subtitle =
  "Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)";

// from colorbrewer.com : 9 shades of green for the map
const schemeGreens = [
  "#f7fcf5",
  "#e5f5e0",
  "#c7e9c0",
  "#a1d99b",
  "#74c476",
  "#41ab5d",
  "#238b45",
  "#006d2c",
  "#00441b",
];

// create a map to store key value/pairs for the bachelors or higher percentage
const degreePerc = d3.map();
// geo svg path generator
const path = d3.geoPath();

// add title and subtitle
d3.select("main").append("header");
d3.select("header")
  .append("h1")
  .attr("id", "title")
  .style("margin", "20px 0 5px 0")
  .text(title);

d3.select("header")
  .append("h3")
  .attr("id", "description")
  .style("margin", "5px 0 10px 0")
  .html(subtitle);

// append svg and position relative to main element
const svg = d3
  .select("main")
  .append("svg")
  .attr("class", "choropleth-map")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

// add the hidden tooltip div
const div = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("opacity", 0);

// process the data
promises = [];
promises.push(d3.json(educationUrl));
promises.push(d3.json(countiesUrl));

// return data from 2 promises
// data[0] is the education statistics by country
// data[1] is the topojson contents
Promise.all(promises).then((data) => {
  // education statistics by county
  const education = data[0];
  // set up a map to quickly return the bachelors or higher degree percentage
  // for a country
  // note: we need this to determine the color threshold ranges on the map
  // as well as for the legend
  education.forEach((d) => {
    d.bachelorsOrHigher = +d.bachelorsOrHigher;
    degreePerc.set(d.fips, d.bachelorsOrHigher);
  });
  // us states and counties topojson
  const us = data[1];

  // determine the min and max of degreePerc necessary for
  // building the range
  const numColors = schemeGreens.length;
  const maxDegreePerc = d3.max(degreePerc.values());
  const minDegreePerc = d3.min(degreePerc.values());
  const stepDegreePerc = (maxDegreePerc - minDegreePerc) / numColors;
  const rangeDegreePerc = d3.range(
    minDegreePerc,
    maxDegreePerc,
    stepDegreePerc
  );
  rangeDegreePerc.push(maxDegreePerc);

  // the color scale is based on quantiles which are determined by the number
  // of colors, in this case 9. These are even steps.
  // for example the min. degree % is 2.6 and max. degree % is 75.1
  // the quantile step is (75.1- 2.6) / 9 = 8.06.
  // the first color is determined for a degree % within the range of 2.6 and
  // 2.6  + 8.06 = 10.65 -> rounded of to 10.7, second = 10.65 to 18.71 + 8.06 etc
  const colorScale = d3
    .scaleQuantile()
    .domain([minDegreePerc, maxDegreePerc])
    .range(schemeGreens);

  // Create a color scale legend with an axis
  // generate an evenly spaced array between two values
  // to use when generating the colors of the legend
  // using colorScale, each entry is within the quantiles by
  // adding 0.1
  const legendRange = d3
    .range(
      minDegreePerc,
      maxDegreePerc,
      (maxDegreePerc - minDegreePerc) / numColors
    )
    .map((d) => Math.round((d + 0.1) * 100) / 100);
  // add a g-group for the legend and set legend color block sizes
  const legendYPos = margin.top;
  const legendXpos = margin.left + 400; //(numColors * colorRectWidth)
  const colorRectHeight = 15;
  const colorRectWidth = 40;
  // add legend and color scale blocks
  const legendGroup = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(" + legendXpos + "," + legendYPos + ")");
  const legendColorBlocks = legendGroup
    .selectAll(".legend-color")
    .data(legendRange)
    .enter()
    .append("rect")
    .attr("class", "legend-color")
    .attr("height", colorRectHeight)
    .attr("width", colorRectWidth)
    .attr("x", (d, i) => i * colorRectWidth)
    .attr("fill", (d, i) => colorScale(d))
    .attr("stroke", "gray");

  // add the x axis for the legend
  const legendTicksScale = d3
    .scaleLinear()
    .domain([minDegreePerc / 100, maxDegreePerc / 100])
    .range([0, colorRectWidth * numColors]);
  const legendAxis = d3
    .axisBottom(legendTicksScale)
    .tickSize(5, 0)
    .tickValues(rangeDegreePerc.map((d) => d / 100))
    .tickFormat(d3.format(".0%"))
    .tickSize(2)
    .tickPadding(5);

  // add a g-group for the legend axis for postioning
  // and the legend axis ticks
  const legendAxisGroup = legendGroup
    .append("g")
    .attr("transform", "translate(0," + colorRectHeight + ")");
  legendAxisGroup.call(legendAxis).select(".domain").remove();

  // use the topojson data to display the map
  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("fill", (d) => colorScale((d.degreePerc = degreePerc.get(d.id))))
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => d.degreePerc)
    .attr(
      "data-county",
      (d) =>
        (d.county = education.filter((obj) => obj.fips == d.id)[0].area_name)
    )
    .attr(
      "data-state",
      (d) => (d.state = education.filter((obj) => obj.fips == d.id)[0].state)
    )
    .attr("d", path)
    // on mouse hover the hidden div tooltip (opacity = 0) will appear
    // displaying the details of the current cell by setting the opacity to 0.7
    .on("mouseover", (d) => {
      div.transition().duration(200).style("opacity", 0.7);
      div
        .html(d.county + ", " + d.state + ": " + round(d.degreePerc) + "%")
        .attr("data-education", d.degreePerc)
        .style("left", d3.event.pageX + 14 + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    // on mouseout set opactity back to 0 to hide
    .on("mouseout", (d) => {
      div.transition().duration(500).style("opacity", 0);
    })
    .append("title")
    .text((d) => d.degreePerc + "%");

  svg
    .append("path")
    .datum(
      topojson.mesh(us, us.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("d", path)
    .attr("fill", "");
});
