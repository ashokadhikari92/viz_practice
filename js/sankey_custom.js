

/*
 * Generate Sankey diagram with given dataset
 */
function generateSankey(sankey) {

    var graph = records.graph;

    var path = sankey.link();

    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function (d) {
            return formatNumber(d) + " " + units;
        },
        color = d3.scale.category20();

    d3.select("svg").remove();
    // append the svg canvas to the page
    var svg = d3.select("#sankey-diagram").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", Math.abs(height + margin.top + margin.bottom))
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // add in the links
    var link = svg.append("g").selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", function(d){
            return "link " + d.flow;
        })
        .attr("d", path)
        .style("stroke-width", function (d) {
            return Math.max(1, d.dy);
        })
        .sort(function (a, b) {
            return b.dy - a.dy;
        });

    // add the link titles
    link.append("title")
        .text(function (d) {
            return d.source.name + " → " +
                d.target.name + "\n" + d.flow + "\n" + format(d.value);
        });

    // add in the nodes
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", function (d) {
            return "node " + d.flow;
        })
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .call(d3.behavior.drag()
            .origin(function (d) {
                return d;
            })
            .on("dragstart", function () {
                this.parentNode.appendChild(this);
            })
            .on("drag", dragmove));

    // add the rectangles for the nodes
    node.append("rect")
        .attr("height", function (d) {
            return Math.abs(d.dy);
        })
        .attr("width", Math.abs(sankey.nodeWidth()))
        .style("fill", function (d) {
            return d.color = color(d.name.replace(/ .*/, ""));
        })
        //.style("stroke", function (d) {
        //    return d3.rgb(d.color).darker(2);
        //})
        .append("title")
        .text(function (d) {
            return d.name + "\n" + format(d.value);
        });

    // add in the title for the nodes
    node.append("text")
        .attr("x", -6)
        .attr("y", function (d) {
            return d.dy / 2;
        })
        .attr("dy", ".15em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) {
            return d.name;
        })
        .filter(function (d) {
            return d.x < width / 2;
        })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");
    function dragmove(d) {
        d3.select(this).attr("transform",
            "translate(" + d.x + "," + (
                d.y = Math.abs(Math.max(0, Math.min(height - d.dy, d3.event.y)))
            ) + ")");
        sankey.relayout();
        link.attr("d", path);
    }
}











