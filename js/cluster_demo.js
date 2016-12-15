var records = {"flows": [], "orgs": [], "years": [], "countries": []};
var api = {
    "base": "https://service.stage.hpc.568elmp03.blackmesh.com/v0/public/fts/flow?limit=10000",
    "organization": "https://service.stage.hpc.568elmp03.blackmesh.com/v0/public/organization",
    "organization_base": "http://service.hpc.vm/v0/public/yi/organization",
    "country": "https://service.stage.hpc.568elmp03.blackmesh.com/v0/public/location",
    "global_cluster": "https://service.stage.hpc.568elmp03.blackmesh.com/v0/public/global-cluster"
};

var units = "USD";

var margin = {top: 50, right: 50, bottom: 50, left: 10},
    width = Math.abs(1000 - margin.left - margin.right),
    height = Math.abs(1600 - margin.top - margin.bottom);

$(document).ready(function () {
    $(".select2").select2();

    loadSelectionFields();

    $("#filter-sankey").on("click", function () {
        filterSankey();
    });

    $("#country").on("change",getOrganizationList);

});

/*
 * Load the options value in selection fields
 */
function loadSelectionFields() {
    getCountryList();
    getYearList();
    // getOrganizationList();
}


/*
 * Get organization list
 */
function getOrganizationList() {
    var selectedCountry = $("#country").val();

    $.ajax({
        type: "GET",
        url: api.organization_base+"?iso3="+selectedCountry,
        dataType: "text",
        success: function (data) {
            data = JSON.parse(data);
            records.orgs = data.data;
            loadOrganizationSelectionField();
        }
    });
}

/*
 * Get list of country
 */
function getCountryList() {
    $.ajax({
        type: "GET",
        url: api.country,
        dataType: "text",
        success: function (data) {
            data = JSON.parse(data);
            records.countries = data.data;
            loadCountrySelectionField();
        }
    });
}

/*
 * Get year list
 */
function getYearList(){
    records.years = ["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017"];
    loadYearSelectionField();
}

/*
 * Load organization selection field with organization list
 */
function loadOrganizationSelectionField() {
    var organizationField = $("#organization");
    organizationField.empty();
    var orgSelections = "<option value='null'> Select Organization </option>";

    records.orgs.forEach(function (org) {
        orgSelections += "<option value='" + org.id + "'>" + org.name + "</option>";
    });

    organizationField.append(orgSelections);
}

/*
 * Load country selection field with country list
 */
function loadCountrySelectionField() {
    var countrySelections = "<option value='null'> Select Country </option>";

    records.countries.forEach(function (country) {
        countrySelections += "<option value='" + country.iso3 + "'>" + country.name + "</option>";
    });

    $("#country").append(countrySelections);
}

/*
 * Load years selection field with country list
 */
function loadYearSelectionField() {
    var yearSelections = "<option value='null'> Select Year </option>";

    records.years.forEach(function (year) {
        yearSelections += "<option value='" + year + "'>" + year + "</option>";
    });

    $("#year").append(yearSelections);
}

/*
 * Filter datasets for sankey according to selected values
 */
function filterSankey() {
    var filterData = records.data;
    var url = null;
    var selectedCountry = $("#country").val();
    var selectedYear = $("#year").val();
    var selectedOrg = $("#organization").val();
    var loader = $(".loader");
    // var selectedOrg = 16068;//13098
    loader.removeClass("hidden");
    $("#chart").empty();

    if(selectedCountry){
        url = api.base+"&countryISO3="+selectedCountry+"&year="+selectedYear+"&organizationID="+selectedOrg;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "text",
            success: function (data) {
                data = JSON.parse(data);
                records.flows = findSourceAndTarget(data.data.flows);
                findSourceAndDestinationNode(records.flows);
                generateSankey();
                loader.addClass("hidden");
            }
        });
    }else {
        alert("Invalid input selection");
        loader.addClass("hidden");
    }

}

/*
 * Find source and target object for the given flow
 */
function findSourceAndTarget(flows){
    flows.forEach(function(flow){
        flow.targetOrganization = flow.destinationObjects.find(function(obj){
                return "Organization" == obj.type;
            }) || {"id":"t0","name":"Not available (target)"};
        flow.sourceOrganization = flow.sourceObjects.find(function(obj){
                return "Organization" == obj.type;
            }) || {"id":"s0","name":"Not available (source)"};

        flow.target = flow.targetOrganization?flow.targetOrganization.name:"Not available (target)";
        flow.source = flow.sourceOrganization?flow.sourceOrganization.name:"Not available (source)";

        flow.target_cluster = flow.destinationObjects.find(function(obj){
                return "GlobalCluster" == obj.type;
            }) || {"id":"tc0","name":"Not Specified (Target)"};
        flow.source_cluster = flow.destinationObjects.find(function(obj){
                return "GlobalCluster" == obj.type;
            }) || {"id":"sc0","name":"Not Specified (Source)"};

        flow.target_globalCluster = flow.target_cluster?flow.target_cluster.name:"Not Specified (Target)";
        flow.source_globalCluster =  flow.source_cluster? flow.source_cluster.name:"Not Specified (Source)";

    });

    return flows;
}
/*
 * Find the source and destination nodes for the sankey
 */
function findSourceAndDestinationNode(flows) {
    console.log("Flow counts : "+ flows.length);
    var graph = {"nodes": [], "links": []};
    var sourceNode = $('input[name=source_node]:checked').val();
    var destinationNode = $('input[name=destination_node]:checked').val();
    var selectedOrg = $("#organization").val();
    // var selectedOrg = 16068;

    var i = 0; var j = 0;
    if (sourceNode && destinationNode) {
        flows.forEach(function (flow) {
            if (selectedOrg == flow.sourceOrganization.id) {
                i++;
                if (!(flow.source == flow[destinationNode])) {
                    j++;
                    graph.nodes.push({"name": flow.source});
                    graph.nodes.push({"name": flow[destinationNode]});
                    graph.links.push({
                        "source": flow.source,
                        "target": flow[destinationNode],
                        "flow": flow["boundary"],
                        "value": +flow["amountUSD"]
                    });
                }
            }

            if (selectedOrg == flow.targetOrganization.id) {
                i++;
                if (!(flow.target == flow[sourceNode])) {
                    j++;
                    graph.nodes.push({"name": flow[sourceNode]});
                    graph.nodes.push({"name": flow.target});
                    graph.links.push({
                        "source": flow[sourceNode],
                        "target": flow.target,
                        "flow": flow["boundary"],
                        "value": +flow["amountUSD"]
                    });
                }
            }
        });

        console.log("value of i : "+i);
        console.log("value of j : "+j);
    }

    records.graph = graph;

    mergeAlikeLinks();

}

/*
 * Merge links with same source and target
 */
function mergeAlikeLinks() {
    var links = JSON.parse(JSON.stringify(records.graph.links));
    var newLinks = [];

    links.forEach(function (linkFirst, firstIndex) {
        var tempLinks = JSON.parse(JSON.stringify(links));

        for (var i = 0; i < tempLinks.length; i++) {
            var linkSecond = tempLinks[i];
            var secondIndex = i;
            if (secondIndex > firstIndex) {
                if (isLinkAlike(linkFirst, linkSecond)) {

                    linkFirst.value = linkFirst.value + linkSecond.value;
                    tempLinks.splice(secondIndex, 1);
                    links.splice(secondIndex, 1);
                    --i;
                }
            }
        }

        newLinks.push(linkFirst);

    });

    records.graph.links = newLinks;
}

/*
 * Check if given two links are alike ( source and target are same)
 */
function isLinkAlike(link1, link2) {
    return ((link1.source == link2.source) && (link1.target == link2.target) && (link1.flow == link2.flow));
}


/*
 * Generate Sankey diagram with given dataset
 */
function generateSankey() {
    d3.select("svg").remove();

    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function (d) {
            return formatNumber(d) + " " + units;
        },
        color = d3.scale.category20();

    // append the svg canvas to the page
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", Math.abs(height + margin.top + margin.bottom))
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Set the sankey diagram properties
    var sankey = d3.sankey()
        .nodeWidth(36)
        .nodePadding(10)
        .size([width, height]);

    var path = sankey.link();
    var i = 1;
    var j = 2;


    var graph = records.graph;
    // return only the distinct / unique nodes
    graph.nodes = d3.keys(d3.nest()
        .key(function (d) {
            return d.name;
        })
        .map(graph.nodes));

    // loop through each link replacing the text with its index from node
    graph.links.forEach(function (d, i) {
        graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
        graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
    });

    //now loop through each nodes to make nodes an array of objects
    // rather than an array of strings
    graph.nodes.forEach(function (d, i) {
        graph.nodes[i] = {"name": d};
    });

    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(0);

    if(graph.links.length == 0){
        alert("No matching flows.");
        return false;
    }


    var bCord= calculateBoundaryCoordinates(graph.nodes);

    console.log(bCord);
    debugger;

    if (bCord.maxInternal > 0) {
        var boundary = svg.selectAll("rect")
            .data([2])
            .enter()
            .append("rect")
            .attr("class", "boundary")
            .attr("x", bCord.x)
            .attr("y", bCord.y)
            .attr("height", bCord.height)
            .attr("width", Math.abs(bCord.width));

        boundary.append("title")
            .text("Internal Boundary");
    }

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
