
        var records = {"rawData":[],"data": [], "orgs": [], "years": [], "counrty": []};


        var units = "USD";

        var margin = {top: 10, right: 10, bottom: 10, left: 10},
                width = Math.abs(800 - margin.left - margin.right),
                height = Math.abs(2000 - margin.top - margin.bottom);

        $(document).ready(function () {
            $(".select2").select2();

            // Load csv data
            loadCsvData();


            $("#filter-sankey").on("click", function () {
                filterSankey();
            });

        });

        /*
         * Get the csv file 
         */
        function loadCsvData(){
            $.ajax({
                type: "GET",
                url: "data/sudan_all.csv",
                dataType: "text",
                success: function (data) {
                    handleData(data);
                }
            });
        }

      
        /*
         * Process the data loaded from csv file
         */
        function handleData(data) {
            var dataObjArray = $.csv.toObjects(data);
            var orgs = [];
            var country = [];
            var usageYears = [];

            dataObjArray.forEach(function(row){
                var source = row.source_organisation.trim();
                var destination = row.destination_organisation.trim();

                if(source){
                    row.source = row.source_organisation = source +", "+ row.source_location;
                    orgs.push(row.source);
                }
                if(destination){
                    row.destination = row.destination_organisation = destination +", "+ row.destination_location;
                    orgs.push(row.destination);
                }

                country.push(row.source_location);
                country.push(row.destination_location);
                usageYears.push(row.source_usageYear);
                usageYears.push(row.destination_usageYear);
            });

            records.data = dataObjArray;

            records.orgs = d3.keys(d3.nest()
                    .key(function (d) {
                        return d;
                    })
                    .map(orgs));

            records.country = d3.keys(d3.nest()
                    .key(function (d) {
                        return d;
                    })
                    .map(country));

            records.years = d3.keys(d3.nest()
                    .key(function (d) {
                        return d;
                    })
                    .map(usageYears));

            loadSelectionFields();


        }

        /*
         * Load the options value in slection fileds
         */
        function loadSelectionFields() {
            var orgSelections = "<option value='null'> Select Organization </option>";
            var countrySelections = "<option value='null'> Select Country </option>";
            var yearSelections = "<option value='null'> Select Year </option>";

            records.orgs.forEach(function (org) {
                orgSelections += "<option value='" + org + "'>" + org + "</option>";
            });

            records.country.forEach(function (cont) {
                countrySelections += "<option value='" + cont + "'>" + cont + "</option>";
            });

            records.years.forEach(function (year) {
                yearSelections += "<option value='" + year + "'>" + year + "</option>";
            });

            $("#organization").append(orgSelections);
            $("#country").append(countrySelections);
            $("#year").append(yearSelections);
        }

        /*
         * Filter datasets for sankey according to selected values 
         */
        function filterSankey() {
            var filterData = records.data;
            var selectedOrg = $("#organization").val();
            var selectedCountry = $("#country").val();
            var selectedYear = $("#year").val();

            if (selectedOrg && 'null' != selectedOrg) {
                filterData = filterData.filter(function (row) {
                    if (selectedOrg == row.source || selectedOrg == row.destination) {
                        return true;
                    }

                    return false;
                });
            }

            if (selectedCountry && 'null' != selectedCountry) {

                filterData = filterData.filter(function (row) {
                    if (selectedCountry == row.source_location || selectedCountry == row.destination_location) {
                        return true;
                    }

                    return false;
                });
            }

            if (selectedYear && 'null' != selectedYear) {
                filterData = filterData.filter(function (row) {
                    if (selectedYear == row.source_usageYear || selectedYear == row.destination_usageYear) {
                        return true;
                    }

                    return false;
                });
            }

            findSourceAndDestinationNode(filterData);

            generateSankey();
        }


        /*
         * Find the source and destination nodes for the sankey 
         */
        function findSourceAndDestinationNode(data){
          var graph = {"nodes": [], "links": []};
          var sourceNode = $('input[name=source_node]:checked').val();
          var destinationNode = $('input[name=destination_node]:checked').val();
          var selectedOrg = $("#organization").val();

          console.log(sourceNode,destinationNode);


          if(sourceNode && destinationNode){
            console.log(data.length);
            debugger;
            data.forEach(function (d) {
              
                 if(selectedOrg == d.source_organisation){
                    if (!(d.source_organisation == d[destinationNode])) {
                        graph.nodes.push({"name": d.source_organisation});
                        graph.nodes.push({"name": d[destinationNode]});
                        graph.links.push({
                            "source": d.source_organisation,
                            "target": d[destinationNode],
                            "flow": d["flow"],
                            "value": +d["amountUSD"]
                        });
                    }
                }


                if(selectedOrg == d.destination_organisation){
                  if (!(d.destination_organisation == d[sourceNode])) {
                      graph.nodes.push({"name": d[sourceNode]});
                      graph.nodes.push({"name": d.destination_organisation});
                      graph.links.push({
                          "source": d[sourceNode],
                          "target": d.destination_organisation,
                          "flow": d["flow"],
                          "value": +d["amountUSD"]
                      });
                  }
                }
            });
          }

  
          records.graph = graph;

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


            // var graph = {"nodes": [], "links": []};
            // data.forEach(function (d) {
            //     // console.log("i");
            //     // console.log(d["source_organisation"]);
            //     if (!(d["source_organisation"] == d["destination_organisation"])) {
            //         console.log("j");
            //         graph.nodes.push({"name": d["source_organisation"], "flow": d["flow"]});
            //         graph.nodes.push({"name": d["destination_organisation"], "flow": d["flow"]});
            //         graph.links.push({
            //             "source": d["source_organisation"],
            //             "target": d["destination_organisation"],
            //             "flow": d["flow"],
            //             "value": +d["amountUSD"]
            //         });
            //     }
            // });

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
                    .layout(32);

            // add in the links
            var link = svg.append("g").selectAll(".link")
                    .data(graph.links)
                    .enter().append("path")
                    .attr("class", function (d) {
                        return "link " + d.flow;
                    })
                    // .attr("class", "link")
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
                    .attr("width", sankey.nodeWidth())
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

            // the function for moving the nodes
            function dragmove(d) {
                d3.select(this).attr("transform",
                        "translate(" + d.x + "," + (
                                d.y = Math.abs(Math.max(0, Math.min(height - d.dy, d3.event.y)))
                        ) + ")");
                sankey.relayout();
                link.attr("d", path);
            }
        }
