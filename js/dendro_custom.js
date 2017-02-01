
/*
 * Generate Dendrogram diagram with given dataset
 */
function generateDendrogram(dendrogram) {

 var path = d3.svg.diagonal()
        .source(function (d) {
            return {
                "x": d.source.y + d.source.dy,
                "y": d.source.x + dendrogram.nodeWidth() / 2
            };
        })
        .target(function (d) {
            return {
                "x": d.target.y + d.target.dy,
                "y": d.target.x + dendrogram.nodeWidth() / 2
            };
        })
        .projection(function (d) {
            return [d.y, d.x];
        });

    var graph = records.graph_copy;

    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function (d) {
            return formatNumber(d) + " " + units;
        },
        color = d3.scale.category20();

    //d3.select("#cluster-dendrogram").empty();
    //d3.select("svg").remove();
// append the svg canvas to the page
    var svg = d3.select("#cluster-dendrogram").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", Math.abs(height + margin.top + margin.bottom))
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // add in the links
    var link = svg.append("g").selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", function (d) {
            return "link " + d.flow;
        })
        .attr("d", path)
        .style("stroke-width", 2)
        .sort(function (a, b) {
            return b.dm - a.dm;
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
        .attr("transform", function (d,i) {
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

    // add the circles for the nodes
    node.append("circle")
        .attr("cx", dendrogram.nodeWidth() / 2)
        .attr("cy", function (d) {
            return d.dy;
        })
        .attr("r", function (d) {
            return Math.sqrt(d.dm);
        })
        .style("fill", function (d) {
            return d.color = color(d.name.replace(/ .*/, ""));
        })
        .style("stroke", function (d) {
            return d3.rgb(d.color).darker(2);
        })
        .append("title")
        .text(function (d) {
            return d.name + "\n" + format(d.value);
        });

    // add in the title for the nodes
    node.append("text")
        .attr("x", -6)
        .attr("y", function (d) {
            return d.dy;
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
        .attr("x", 6 + dendrogram.nodeWidth())
        .attr("text-anchor", "start");
    function dragmove(d) {
        d3.select(this).attr("transform",
            "translate(" + d.x + "," + (
                d.y = Math.abs(Math.max(0, Math.min(height - d.dy, d3.event.y)))
            ) + ")");
        dendrogram.relayout();
        link.attr("d", path);
    }


    var bCord= calculateBoundaryCoordinates(graph.nodes);


    // if (bCord.maxInternal > 0) {
    //     var boundary = svg.selectAll("rect")
    //         .data([2])
    //         .enter()
    //         .append("rect")
    //         .attr("class", "boundary")
    //         .attr("x", bCord.x)
    //         .attr("y", bCord.y)
    //         .attr("height", bCord.height)
    //         .attr("width", Math.abs(bCord.width));
    //
    //     boundary.append("title")
    //         .text("Internal Boundary");
    // }

}

function calculateBoundaryCoordinates(nodes){
    var maxInternal = 0; var maxIncoming = 0;

    nodes.forEach(function(node){
        if("internal" == node.flow){
            maxInternal = Math.max(node.x,maxInternal);
        }
        if("incoming" == node.flow){
            maxIncoming = Math.max(node.x,maxIncoming);
        }
    });
    console.log(maxInternal,maxIncoming);

    return {'maxInternal':maxInternal,'x':maxIncoming + 50,'width':(maxInternal - maxIncoming) ,'y':-50,'height':height + 100};
}