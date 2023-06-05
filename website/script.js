// This is where you would write your JavaScript code to create the data visualization.
// You can use jQuery and D3.js to manipulate the DOM and create the visualization.
// For example, you could use D3.js to create a bar chart, and use jQuery to fetch data from an API.

// Example D3.js code to create a bar chart:

// const menu = document.querySelector("#mobile_menu");
// const menu_links = document.querySelector(".navig_menu");
// const kibramlogo = document.querySelector("#kibram_logo");

// // NAVIGATION MENU
// const mobilemenu = () => {
//   menu.classList.toggle("is-active");
//   menu_links.classList.toggle("active");
// };

// menu.addEventListener("click", mobilemenu);

// TEAM
const members = document.querySelectorAll(".member");
members.forEach((member) => {
  const img = member.querySelector("img");
  img.addEventListener("mouseenter", () => {
    img.style.transform = "scale(1.1)";
  });
  img.addEventListener("mouseleave", () => {
    img.style.transform = "scale(1)";
  });
});

//define tooltip
const tooltip = d3.select("#tooltip").style("opacity", 0);

//////////// VISUALIZATIONS ////////////

//loading data from csv files
//load csv data
Promise.all([
  d3.csv("data/final_artists_red2.csv"),
  d3.csv("data/final_clustering.csv"),
]).then(function (values) {
  //storing data from csv into variables
  var artists = values[0];
  var clustering = values[1];

  d3.select('.box').style('opacity' , 0)

  CreateScatterplot(artists , clustering);
  // CreateArcs('Taylor Swift' , clustering , artists) 
  CreateCluster(clustering)
  populateDropdowns(clustering)
  selectOptions()
  MultiLine(clustering)
}); 
//function for wrapping text 
    //source: https://bl.ocks.org/mbostock/7555321
    function wrap(text, width) {
      text.each(function () {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1, // ems
              x = text.attr("x"),
              y = text.attr("y"),
              dy = 0, 
              tspan = text.text(null)
                          .append("tspan")
                          .attr("x", x)
                          .attr("y", y)
                          .attr("dy", dy + "em"); 
          while (word = words.pop()) {
              line.push(word); 
              tspan.text(line.join(" "));
              if (tspan.node().getComputedTextLength() > width) {
                  line.pop();
                  tspan.text(line.join(" "));
                  line = [word];
                  tspan = text.append("tspan")
                              .attr("x", x)
                              .attr("y", y)
                              .attr("dy", ++lineNumber * lineHeight + dy + "em")
                              .text(word);
              }
          }
      });
  }

