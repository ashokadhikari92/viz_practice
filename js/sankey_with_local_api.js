var records = {"graph":{},"flows": [], "orgs": [], "years": [], "countries": []};
var api = {
    "base": "http://localhost:3000/api/flow?limit=10000",
    "organization": "http://localhost:3000/api/organization",
    "country": "http://localhost:3000/api/country"
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

    $("#country,#year").on("change",getOrganizationList);

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
    var selectedYear = $("#year").val();
    console.log(selectedCountry,selectedYear);
    console.log((selectedCountry !== 'null') && (selectedYear !== 'null'));


    if((selectedCountry !== 'null') && (selectedYear !== 'null')){ 
        var loader = $(".loader");
        loader.removeClass("hidden");    
        $.ajax({
            type: "GET",
            url: api.organization +"?iso3="+selectedCountry+"&year="+selectedYear,
            dataType: "text",
            success: function (data) {
                records.orgs = JSON.parse(data).data;
                loadOrganizationSelectionField();
                loader.addClass("hidden");
            }
        });
    }

}

/*
 * Get list of country
 */
function getCountryList() {
    $.ajax({
        type: "GET",
        url: api.country,
        dataType: "JSON",
        success: function (data) {
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
    var sourceNode = $('input[name=source_node]:checked').val();
    var destinationNode = $('input[name=destination_node]:checked').val();
    var loader = $(".loader");
    loader.removeClass("hidden");

    $("#chart").empty();

    if(selectedCountry){
        url = api.base+"&countryISO3="+selectedCountry+"&year="+selectedYear+"&organizationID="+selectedOrg+"&sourceNode="+sourceNode+"&destinationNode="+destinationNode;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "text",
            success: function (data) {
                data = JSON.parse(data);
                records.graph = data;
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
