var records = {"flows": [], "orgs": [], "years": [], "countries": []};
var api = {
    // "base": "https://service.stage.hpc.568elmp03.blackmesh.com/v0/public/fts/flow?limit=10000",
    "base":"http://service.fts.yipl.com.np/v0/public/fts/flow?limit=1000&planID=",
    "appeal":"http://service.fts.yipl.com.np/v0/public/plan/year/",
    "organization": "http://service.fts.yipl.com.np/v0/public/yi/organization",
    "organization_base": "http://service.fts.yipl.com.np/v0/public/yi/organization",
    "country": "https://service.stage.hpc.568elmp03.blackmesh.com/v0/public/location",
    "global_cluster": "https://service.stage.hpc.568elmp03.blackmesh.com/v0/public/global-cluster"
};

var units = "USD";

var margin = {top: 50, right: 50, bottom: 50, left: 10},
    width = Math.abs(1000 - margin.left - margin.right),
    height = Math.abs(1600 - margin.top - margin.bottom);

$(document).ready(function () {
    $(".select2").select2({width: '100%'});

    loadSelectionFields();

    $("#filter-sankey").on("click", function () {
        filterSankey();
    });

    $("#year").on("change", getAppealList);
    $("b[role='presentation']").remove();

    $(".select2-selection__arrow").append('<span class="glyphicon glyphicon-menu-down"></span>');


});

/*
 * Load the options value in selection fields
 */
function loadSelectionFields() {
    getYearList();
}


/*
 * Get organization list
 */
function getAppealList() {
    var selectedYear = $("#year").val();

    $.ajax({
        type: "GET",
        url: api.appeal + selectedYear,
        dataType: "json",
        success: function (data) {
            console.log(data);debugger;
            records.appeals = data.data;
            loadAppealSelectionField();
        }
    });
}

/*
 * Get year list
 */
function getYearList() {
    records.years = ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017"];
    loadYearSelectionField();
}

/*
 * Load appeal selection field with country list
 */
function loadAppealSelectionField() {
    $("#appeals").empty();
    var appealSelections = "<option value='null'> Select Appeal </option>";

    records.appeals.forEach(function (appeal) {
        appealSelections += "<option value='" + appeal.id + "'>" + appeal.name + "</option>";
    });

    $("#appeals").append(appealSelections);
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
    var loader = $(".loader");
    loader.removeClass("hidden");
    $("#cluster-dendrogram").empty();
    $("#sankey-diagram").empty();
    $("#no-data").empty();
    var appeal = $("#appeals").val();

    if (appeal) {
        // url = api.base + "&countryISO3=" + selectedCountry + "&year=" + selectedYear + "&organizationID=" + selectedOrg;
        url = api.base + appeal;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "text",
            success: function (data) {
                data = JSON.parse(data);
                records.flows = findSourceAndTarget(data.data.flows);
                findSourceAndDestinationNode(records.flows);

                data = calculateGraphValues();

                if(data){
                    generateSankey(data.sankey);
                    generateDendrogram(data.dendrogram);
                }
                loader.addClass("hidden");
            },
            error:function(err){
                $("#no-data").html("Error occurred while fetching data.");
                loader.addClass("hidden");
            }
        });
    } else {
        $("#no-data").html("Invalid input selection.");
        loader.addClass("hidden");
    }

}

/*
 * Find source and target object for the given flow
 */
function findSourceAndTarget(flows) {
    flows.forEach(function (flow) {
        flow.targetOrganization = flow.destinationObjects.find(function (obj) {
                return "Organization" == obj.type;
            }) || {"id": "t0", "name": "Not available (target)"};
        flow.sourceOrganization = flow.sourceObjects.find(function (obj) {
                return "Organization" == obj.type;
            }) || {"id": "s0", "name": "Not available (source)"};

        flow.target = flow.targetOrganization ? flow.targetOrganization.name : "Not available (target)";
        flow.source = flow.sourceOrganization ? flow.sourceOrganization.name : "Not available (source)";

        flow.target_cluster = flow.destinationObjects.find(function (obj) {
                return "GlobalCluster" == obj.type;
            }) || {"id": "tc0", "name": "Not Specified (Target)"};
        flow.source_cluster = flow.destinationObjects.find(function (obj) {
                return "GlobalCluster" == obj.type;
            }) || {"id": "sc0", "name": "Not Specified (Source)"};

        flow.target_globalCluster = flow.target_cluster ? flow.target_cluster.name : "Not Specified (Target)";
        flow.source_globalCluster = flow.source_cluster ? flow.source_cluster.name : "Not Specified (Source)";

    });

    return flows;
}
/*
 * Find the source and destination nodes for the sankey
 */
function findSourceAndDestinationNode(flows) {
    console.log("Flow counts : " + flows.length);
    var graph = {"nodes": [], "links": []};
    var sourceNode = $('input[name=source_node]:checked').val();
    var destinationNode = $('input[name=destination_node]:checked').val();
    // var selectedOrg = $("#organization").val();
    // var selectedOrg = 16068;

    var i = 0;
    var j = 0;
    if (sourceNode && destinationNode) {
        flows.forEach(function (flow) {
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
        });

    }

    records.graph = graph;
    records.graph1 = graph;

    mergeAlikeLinks();

    records.graph1.links = JSON.parse(JSON.stringify(records.graph.links))

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


function calculateGraphValues(){

    d3.select("svg").remove();

    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function (d) {
            return formatNumber(d) + " " + units;
        },
        color = d3.scale.category20();


    // Set the sankey diagram properties
    var sankey = d3.sankey()
        .nodeWidth(36)
        .nodePadding(10)
        .size([width, height]);

    var dendrogram = d3.dendrogram()
        .nodeWidth(36)
        .nodePadding(10)
        .size([width, height]);

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

    var graph_copy =  JSON.parse(JSON.stringify(records.graph));

    records.graph_copy = graph_copy;

    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(0);

    dendrogram
        .nodes(graph_copy.nodes)
        .links(graph_copy.links)
        .layout(0);


    if(graph.links.length == 0){
        $("#no-data").html("No matching flows.");
        return false;
    }

    return {'sankey':sankey,'dendrogram':dendrogram};
}
