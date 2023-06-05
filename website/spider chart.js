function populateDropdowns(data) {
  data.sort((a, b) => a.name.localeCompare(b.name));
  var first, second;
  const groupedData = d3.group(data, (d) => d.name); // group by song

  const uniquesongs = Array.from(groupedData.keys()); // get unique song
  console.log(uniquesongs);

  // Create the first dropdown
  const firstsongDropdown = d3.select("#first-song-customDropdown");

  firstsongDropdown
    .selectAll(".custom-dropdown-option")
    .data(uniquesongs)
    .enter()
    .append("div")
    .classed("custom-dropdown-option", true)
    .text((d) => d)
    .on("click", function () {
      const selectedValue = d3.select(this).text();
      firstSongSearchInput.value = selectedValue;
      firstsongDropdown.style.display = "none"; // Hide the dropdown after selection

      console.log("First song dropdown changed to:", selectedValue);
      first = selectedValue;
      createSpiderChart(first, second, data);
    });

  const firstSongSearchInput = document.getElementById(
    "first-song-searchInput"
  );
  const customDropdown = document.getElementById("first-song-customDropdown");

  // Show the dropdown when the search input is clicked
  firstSongSearchInput.addEventListener("click", function () {
    customDropdown.style.display = "block";
  });

  // Filter the options based on the search input value
  function filterFirstSongOptions() {
    const searchValue = firstSongSearchInput.value.toLowerCase();
    const options = firstsongDropdown.selectAll(".custom-dropdown-option");

    options.each(function () {
      const optionText = d3.select(this).text().toLowerCase();
      const displayStyle = optionText.includes(searchValue) ? "block" : "none";
      d3.select(this).style("display", displayStyle);
    });
  }

  // Close the dropdown when clicking outside
  document.addEventListener("click", function (event) {
    const target = event.target;
    if (target !== firstSongSearchInput && target !== customDropdown) {
      customDropdown.style.display = "none";
    }
  });

  // Add the onkeyup event listener for the search input
  firstSongSearchInput.addEventListener("keyup", filterFirstSongOptions);

  // Create the second dropdown
  const secondsongDropdown = d3.select("#second-song-customDropdown");

  secondsongDropdown
    .selectAll(".custom-dropdown-option")
    .data(uniquesongs)
    .enter()
    .append("div")
    .classed("custom-dropdown-option", true)
    .text((d) => d)
    .attr("selected", (d, i) => (i === 1 ? true : null)) // Set the default selected index
    .on("click", function () {
      const selectedValue = d3.select(this).text();
      secondSongSearchInput.value = selectedValue;
      secondsongDropdown.style.display = "none"; // Hide the dropdown after selection

      console.log("Second song dropdown changed to:", selectedValue);
      second = selectedValue;
      createSpiderChart(first, second, data);
    });

  const secondSongSearchInput = document.getElementById(
    "second-song-searchInput"
  );
  const secondCustomDropdown = document.getElementById(
    "second-song-customDropdown"
  );

  // Show the dropdown when the search input is clicked
  secondSongSearchInput.addEventListener("click", function () {
    secondCustomDropdown.style.display = "block";
  });

  // Filter the options based on the search input value
  function filterSecondSongOptions() {
    const searchValue = secondSongSearchInput.value.toLowerCase();
    const options = secondsongDropdown.selectAll(".custom-dropdown-option");

    options.each(function () {
      const optionText = d3.select(this).text().toLowerCase();
      const displayStyle = optionText.includes(searchValue) ? "block" : "none";
      d3.select(this).style("display", displayStyle);
    });
  }

  // Close the dropdown when clicking outside
  document.addEventListener("click", function (event) {
    const target = event.target;
    if (target !== secondSongSearchInput && target !== secondCustomDropdown) {
      secondCustomDropdown.style.display = "none";
    }
  });

  // Add the onkeyup event listener for the search input
  secondSongSearchInput.addEventListener("keyup", filterSecondSongOptions);

  first = uniquesongs[0];
  second = uniquesongs[1];

  createSpiderChart(first, second, data);
}

////////////////////// COMPARE AUDIO TRACKS - SPIDER CHART //////////////////////
function createSpiderChart(firstsong, secondsong, data) {
  d3.select("#radarChart").remove();
  // Set the dimensions and margins for the SVG
  const margin = { top: 30, right: 10, bottom: 10, left: 10 };
  const width = 600 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Set up the SVG element
  svg = d3
    .select("#spider")
    .append("svg")
    .attr("id", "radarChart")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr(
      "viewBox",
      "0 0 " +
        (width + margin.left + margin.right) +
        " " +
        (height + margin.top + margin.bottom)
    )
    .append("g")
    .attr(
      "transform",
      `translate(${margin.left + width / 2}, ${margin.top + height / 2 - 25})`
    );

  var columns = [
    "acousticness",
    "energy",
    "liveness",
    "valence",
    "tempo",
    "danceability",
    "popularity",
  ];

  // Get the unique song names
  var songNames = [...new Set(data.map((item) => item.name))];

  // Create an array to hold the result
  var result = [];

  // For each song type
  songNames.forEach((songType) => {
    // Filter the data based on the current song type
    let songData = data.filter((d) => d.name == songType);

    // Calculate the averages and add them to an array
    let averages = columns.map((column) => {
      // calculate the sum of the column values
      let sum = songData.reduce((acc, curr) => acc + Number(curr[column]), 0);

      // calculate the average
      return sum / songData.length;
    });

    // Add the result to the 'result' array
    result.push({
      name: songType,
      values: averages,
    });
  });

  firstsongChartData = result.filter((d) => d.name == firstsong);
  secondsongChartData = result.filter((d) => d.name == secondsong);

  var firstsongId = data.filter((d) => d.name == firstsong);
  var secondsongId = data.filter((d) => d.name == secondsong);

  d3.select("#song1").attr(
    "src",
    "https://open.spotify.com/embed/track/" + firstsongId[0].id
  );
  d3.select("#song2").attr(
    "src",
    "https://open.spotify.com/embed/track/" + secondsongId[0].id
  );

  function radarChartPath(data, angleScale, radialScale, columns) {
    const pathData = data.values.map((value, index) => {
      const angle = angleScale(index);
      const x = radialScales[index](value) * Math.sin(angle);
      const y = -radialScales[index](value) * Math.cos(angle);
      return [x, y];
    });

    pathData.push(pathData[0]); // Close the path
    const path = d3.line()(pathData);
    return path;
  }

  // Scales and settings for radar chart
  const angleScale = d3
    .scaleLinear()
    .domain([0, columns.length])
    .range([0, 2 * Math.PI]);

  const radius = Math.min(width, height) / 2 - 90;

  // Find the maximum value in the 'values' array across all data points
  const maxValue = Math.max(
    ...firstsongChartData.map((d) => Math.max(...d.values)),
    ...secondsongChartData.map((d) => Math.max(...d.values))
  );
  // Define the radial scale with the updated domain
  const radialScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);

  const radialScales = columns.map((col) => {
    const maxValue = Math.max(
      ...firstsongChartData.map((d) => d.values[columns.indexOf(col)]),
      ...secondsongChartData.map((d) => d.values[columns.indexOf(col)])
    );
    return d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
  });

  // Draw radial lines
  const radialLines = svg
    .selectAll(".radial-line")
    .data(columns)
    .enter()
    .append("line")
    .attr("class", "radial-line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => radialScales[i].range()[1] * Math.sin(angleScale(i)))
    .attr("y2", (d, i) => -radialScales[i].range()[1] * Math.cos(angleScale(i)))
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  // Draw axis labels
  const axisLabels = svg
    .selectAll(".axis-label")
    .data(columns)
    .enter()
    .append("text")
    .attr("class", "axis-label")
    .attr(
      "x",
      (d, i) => (radialScales[i].range()[1] + 50) * Math.sin(angleScale(i))
    )
    .attr(
      "y",
      (d, i) => -(radialScales[i].range()[1] + 50) * Math.cos(angleScale(i))
    )
    .text((d) => d)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");

  const numTicks = 5; // Define the number of ticks for each axis

  columns.forEach((col, i) => {
    const tickValues = d3
      .range(1, numTicks + 1)
      .map((d) => d * (radialScales[i].domain()[1] / numTicks));

    tickValues.forEach((tick) => {
      svg
        .append("line")
        .attr("class", "tick-line")
        .attr("x1", radialScales[i](tick) * Math.sin(angleScale(i)))
        .attr("y1", -radialScales[i](tick) * Math.cos(angleScale(i)))
        .attr(
          "x2",
          radialScales[i](tick) * Math.sin(angleScale((i + 1) % columns.length))
        )
        .attr(
          "y2",
          -radialScales[i](tick) *
            Math.cos(angleScale((i + 1) % columns.length))
        )
        .attr("stroke", "lightgray")
        .attr("stroke-width", 1);
    });

    // Draw tick values text
    const tickTextPadding = 5;
    tickValues.forEach((tick) => {
      svg
        .append("text")
        .attr("class", "tick-text")
        .attr(
          "x",
          (radialScales[i](tick) + tickTextPadding) * Math.sin(angleScale(i))
        )
        .attr(
          "y",
          -(radialScales[i](tick) + tickTextPadding) * Math.cos(angleScale(i))
        )
        .text(tick.toFixed(1))
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "10px")
        .attr("fill", "black");
    });
  });

  // Draw filled polygons for radar chart
  const radarPolygons = svg
    .selectAll(".radar-polygon")
    .data(firstsongChartData)
    .enter()
    .append("path")
    .attr("class", "radar-polygon")
    .attr("d", (d) =>
      radarChartPath(
        { values: d.values.map(() => 0) },
        angleScale,
        radialScales,
        columns
      )
    )
    .attr("stroke", "#950069")
    .attr("fill", "#950069")
    .attr("fill-opacity", 0.5)
    .attr("stroke-width", 2)
    .on("mousemove", function (event, d) {
      d3.select(this).attr("stroke", "black").attr("stroke-width", "3px");

      d3.select("#tooltip")
        .html("<b>Song Name: </b> " + d.name)
        .style("left", event.pageX - 35 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke-width", "2px").attr("stroke", "#950069");
      d3.select("#tooltip").style("opacity", 0);
    })
    .transition()
    .duration(500) // Set the duration of the animation in milliseconds
    .attr("d", (d) => radarChartPath(d, angleScale, radialScales, columns));

  // Draw filled polygons for radar chart (second song)
  const radarPolygons2 = svg
    .selectAll(".radar-polygon2")
    .data(secondsongChartData)
    .enter()
    .append("path")
    .attr("class", "radar-polygon2")
    .attr("d", (d) =>
      radarChartPath(
        { values: d.values.map(() => 0) },
        angleScale,
        radialScales,
        columns
      )
    )
    .attr("stroke", "#CCF463")
    .attr("fill", "#CCF463")
    .attr("fill-opacity", 0.5)
    .attr("stroke-width", 2)
    .on("mousemove", function (event, d) {
      d3.select(this).attr("stroke", "black").attr("stroke-width", "3px");

      d3.select("#tooltip")
        .html("<b>Song Name: </b> " + d.name)
        .style("left", event.pageX - 35 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke-width", "2px").attr("stroke", "#CCF463");
      d3.select("#tooltip").style("opacity", 0);
    })
    .transition()
    .duration(500) // Set the duration of the animation in milliseconds
    .attr("d", (d) => radarChartPath(d, angleScale, radialScales, columns));
}
////////////////////// COMPARE AUDIO TRACKS - SPIDER CHART - END //////////////////////
