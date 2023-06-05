
function selectOptions(){
    // Function to limit the number of selected checkboxes
   d3.selectAll(".attributeCheckbox").on("change", function() {
     if (d3.selectAll(".attributeCheckbox:checked").size() > 4) {
         alert("You can only select 4 attributes at a time!");
         this.checked = false;
     }
   }); 
   }
function MultiLine(data){
   
     // You need to parse numeric values as they are stored as strings in the data
   let parseData = function(data) {
     data.forEach(function(d) {
         d.popularity = +d.popularity;
         d.acousticness = +d.acousticness;
         d.danceability = +d.danceability;
         d.duration = +d.duration;
         d.energy = +d.energy;
         d.instrumentalness = +d.instrumentalness;
         d.key = +d.key;
         d.liveness = +d.liveness;
         d.loudness = +d.loudness;
         d.modality = +d.modality;
         d.speechiness = +d.speechiness;
         d.tempo = +d.tempo;
         d.valence = +d.valence;
     });
     return data;
   };
   
   // Define SVG and margin
   let margin = {top: 10, right: 150, bottom: 50, left: 60},
     width = 650 - margin.left - margin.right,
     height = 300 - margin.top - margin.bottom;
   
   let svg = d3.select("#chartContainerLine")
     .append("svg")
     .attr("preserveAspectRatio", "xMinYMin meet")
         .attr(
           "viewBox",
           "0 0 " +
             (width + margin.left + margin.right) +
             " " +
             (height + margin.top + margin.bottom)
         )
     .append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
   
      
     data = parseData(data);
       
     // Update the chart
     d3.select("#updateChart").on("click", function() {
       
         // Clear the SVG
         svg.selectAll("*").remove();
         // Add X Axis label:
         svg.append("text")
         .attr("text-anchor", "end")
         .attr("x", width/2 + margin.left)
         .attr("y", height + margin.top  +20)
         .text("Popularity");
   
         // Add Y Axis label:
         svg.append("text")
         .attr("text-anchor", "end")
         .attr("transform", "rotate(-90)")
         .attr("y", -margin.left+20)
         .attr("x", -margin.top-height/2)
         .text("Measure");
   
     
         // Get the selected attributes
         let selectedAttributes = d3.selectAll(".attributeCheckbox:checked").nodes().map(function(d){ return d.value; });
     
         // Create scales
         let x = d3.scaleLinear().domain([0, 100]).range([ 0, width ]);
         svg.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));
         
         let y = d3.scaleLinear().range([ height, 0 ]);
         svg.append("g").call(d3.axisLeft(y));
   
         const color = d3.scaleOrdinal()
       .range(["#950069", "#D1345B", "#F5754C", "#FFB74B"]);
         
         // Draw lines
         selectedAttributes.forEach(function(attribute) {
             // Compute average per popularity
             let averages = d3.rollups(data, v => d3.mean(v, d => d[attribute]), d => d.popularity);
             averages.sort((a, b) => a[0] - b[0]);
             
             // Update y scale domain
             y.domain([0, d3.max(averages, function(d) { return d[1]; })]);
             
             // Draw the line
           let path = svg.append("path")
           .datum(averages)
           .attr("fill", "none")
           .attr("stroke", function() {  return color(attribute)  })
           .attr("stroke-width", 1.5)
           .attr("d", d3.line()
               .x(function(d) { return x(d[0]); })
               .y(function(d) { return y(d[1]); })
               .curve(d3.curveBasis)
           );
   
           // Draw the text
           let text = svg.append("text")
           .attr("transform", "translate(" + x(averages[averages.length-1][0]) + "," + y(averages[averages.length-1][1]) + ")")
           .attr("dy", ".35em")
           .attr("text-anchor", "start")
           .style("fill", function() {return color(attribute)  })
           .style("fill-opacity", 0)  // Initially invisible
           .text(attribute);
   
           // Create the line animation
           let totalLength = path.node().getTotalLength();
           path
           .attr("stroke-dasharray", totalLength + " " + totalLength)
           .attr("stroke-dashoffset", totalLength)
           .transition()  // Start a transition
           .duration(2000)  // Set its duration to 2000ms
           .attr("stroke-dashoffset", 0)  // Transition the stroke-dashoffset to 0
           .on("end", function() {
               // Start the text animation after the line is fully drawn
               text.transition()
                   .duration(500)  // Set its duration to 500ms
                   .style("fill-opacity", 1);  // Transition the fill-opacity to 1
           });
   
         });
     });
     document.getElementById("updateChart").click();
   
    
   
   
   }
   
   