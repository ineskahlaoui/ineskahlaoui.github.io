function CreateScatterplot(data, clusteringData) {
  // Set the dimensions and margins of the graph
  var margin = { top: 10, right: 30, bottom: 50, left: 80 },
    width = 600 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

  var brush = d3
      .brush()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("end", brushended),
    idleTimeout,
    idleDelay = 350;

  // Append the svg object to the body of the page
  var svg = d3
    .select("#artists_exploration")
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

  // Create color scale
  var genres = Array.from(new Set(data.map((d) => d.genres))); // get unique genres
  var color = d3
    .scaleOrdinal()
    .domain(genres)
    .range(d3.quantize(d3.interpolateRainbow, genres.length));

  // Add X axis
  var x = d3
    .scaleLinear()
    .domain([
      d3.min(data, function (d) {
        return +d.popularity;
      }) - 1,
      d3.max(data, function (d) {
        return +d.popularity;
      }) + 1,
    ])
    .range([0, width])
    .nice();
  var xAxis = d3.axisBottom(x);
  svg
    .append("g")
    .attr("id", "axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // X axis label:
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text("Popularity");

  // Add Y axis
  var y = d3
    .scaleLinear()
    .domain([
      d3.min(data, function (d) {
        return +d.followers;
      }),
      d3.max(data, function (d) {
        return +d.followers;
      }),
    ])
    .range([height, 0])
    .nice();
  var yAxis = d3.axisLeft(y);
  svg.append("g").attr("id", "axis--y").call(yAxis);

  // Y axis label:
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top - height / 2 + 20)
    .text("Followers");

  var clip = svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  var scatter = svg
    .append("g")
    .attr("id", "scatterplot")
    .attr("clip-path", "url(#clip)");

  scatter.append("g").attr("class", "brush").call(brush);

  // Add dots
  scatter
    .append("g")
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", function (d) {
      return x(+d.popularity);
    })
    .attr("cy", height) // initially setting to height to start animation from bottom
    .on("mousemove", function (event, d) {
      d3.select(this).attr("stroke", "black").attr("r", 7);

      d3.select("#tooltip")
        .html(
          "<b>Artist: </b>" +
            d.name +
            "</br><b>Followers: </b>" +
            d.followers +
            "</br><b>Popularity: </b>" +
            d.popularity +
            "</br><b>Genres: </b>" +
            d.genres
        )
        .style("left", event.pageX + 25 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this)
        .attr("stroke", function (d) {
          return color(d.genres);
        })
        .attr("r", 3);
      d3.select("#tooltip")
        .style("opacity", 0)
        .style("left", 0 + "px")
        .style("top", 0 + "px");
    })
    .on("click", function (event, d) {
      d3.selectAll(".dot").attr("opacity", 0.45).attr("fill-opacity", "0.5");
      d3.select(this).attr("opacity", 1).attr("fill-opacity", "1");

      var modifiedEmbedLink = d.embed_link.replace(
        'height="352"',
        'height="100%"'
      );
      document.querySelector(".top_songs").innerHTML = modifiedEmbedLink;
      d3.select(".box").style("opacity", 0);
      CreateArcs(d.name, clusteringData, data);
    })
    .transition() // start transition
    .duration(2000) // transition duration
    .attr("cy", function (d) {
      return y(+d.followers);
    })
    .attr("r", 3)
    .attr("stroke", function (d) {
      return color(d.genres);
    })
    .attr("fill-opacity", "0.5")
    .style("fill", function (d) {
      return color(d.genres);
    });

  function brushended(event) {
    var s = event.selection;
    if (!s) {
      if (!idleTimeout) return (idleTimeout = setTimeout(idled, idleDelay));
      x.domain([
        d3.min(data, function (d) {
          return +d.popularity;
        }) - 1,
        d3.max(data, function (d) {
          return +d.popularity;
        }) + 1,
      ]).nice();
      y.domain(
        d3.extent(data, function (d) {
          return +d.followers;
        })
      ).nice();
    } else {
      x.domain([s[0][0], s[1][0]].map(x.invert, x));
      y.domain([s[1][1], s[0][1]].map(y.invert, y));
      svg.select(".brush").call(brush.move, null);
    }
    zoom();
  }

  function idled() {
    idleTimeout = null;
  }

  function zoom() {
    var t = svg.transition().duration(750);
    svg.select("#axis--x").transition(t).call(xAxis);
    svg.select("#axis--y").transition(t).call(yAxis);
    scatter
      .selectAll("circle")
      .transition(t)
      .attr("cx", function (d) {
        return x(+d.popularity);
      })
      .attr("cy", function (d) {
        return y(+d.followers);
      });
  }
}

function CreateArcs(name, data, artistsData) {
  d3.select(".arcs svg").remove();
  var splitArtists = [];
  var radius = 200;

  data.forEach(function (artist) {
    // Assuming genre is a string that looks like an array.
    var artists = JSON.parse(artist["artist name"].replace(/'/g, '"'));
    artists.forEach(function (d) {
      var newartist = { ...artist }; // Create a copy of the artist object
      newartist["artist name"] = d; // Replace the genre attribute
      splitArtists.push(newartist);
    });
  });

  var artistData = splitArtists.filter((d) => d["artist name"] == name);
  var min = Math.floor(d3.min(artistData, (d) => +d.popularity) / 10) * 10;

  // First, group the data by artist and album
  var nestedData = d3.group(
    artistData,
    (d) => d["artist name"],
    (d) => d["album name"]
  );

  var albums = [];

  // Then calculate the average popularity for each album by each artist
  nestedData.forEach((albumsMap, artist) => {
    albumsMap.forEach((songs, album) => {
      var averagePopularity = d3.mean(songs, (d) => +d.popularity);
      albums.push({ album, popularity: averagePopularity });
    });
  });

  //  Define SVG dimensions
  const width = 600;
  const height = 600;

  //  Define a SVG element
  const svg = d3
    .select(".arcs")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height)
    .append("g");

  // Update the range of the angle scale to go from 20 to 160 degrees
  const angleScale = d3
    .scaleLinear()
    .domain([100, min]) // Assume popularity is a score between 0 and 100
    .range([50 * (Math.PI / 180), 110 * (Math.PI / 180)]); // Map to angles between 20 and 160 degrees

  //   Update the start and end angles of the arc to match
  console.log(radius);
  radiusAlbum = radius + 150;
  const arc = d3
    .arc()
    .innerRadius(radiusAlbum)
    .outerRadius(radiusAlbum)
    .startAngle(50 * (Math.PI / 180)) // start at 20 degrees
    .endAngle(110 * (Math.PI / 180)); // end at 160 degrees

  radiusSongs = radius + 300;

  //  Update the start and end angles of the arc to match
  const arcSongs = d3
    .arc()
    .innerRadius(radiusSongs)
    .outerRadius(radiusSongs)
    .startAngle(50 * (Math.PI / 180)) // start at 20 degrees
    .endAngle(110 * (Math.PI / 180)); // end at 160 degrees

  //draw lines
  // Iterate over the artistData array
  artistData.forEach((song) => {
    // Find the matching album
    const album = albums.filter((d) => d.album == song["album name"])[0];

    if (album) {
      // Calculate the coordinates for the album and the song
      const albumCoords = [
        -120 +
          radiusAlbum * Math.cos(angleScale(album.popularity) - Math.PI / 2), // add the x translation
        height / 2 +
          30 +
          radiusAlbum * Math.sin(angleScale(album.popularity) - Math.PI / 2), // add the y translation
      ];
      const songCoords = [
        radius -
          250 +
          radiusSongs * Math.cos(angleScale(song.popularity) - Math.PI / 2), // add the x translation
        height / 2 +
          30 +
          radiusSongs * Math.sin(angleScale(song.popularity) - Math.PI / 2), // add the y translation
      ];

      // Add the line to the SVG
      svg
        .append("line")
        .attr("id", album.album.replace(/[^a-zA-Z]/g, ""))
        .attr("x1", albumCoords[0])
        .attr("y1", albumCoords[1])
        .attr("x2", songCoords[0])
        .attr("y2", songCoords[1])
        .attr("stroke-width", 1)
        .attr("opacity", 0)
        .attr("stroke", "#3E046C");
    }
  });

  var albumArc = svg
    .append("g")
    .attr("transform", "translate(" + -120 + "," + (height / 2  +30) + ")");

  albumArc
    .append("text")
    .attr("x", 220)
    .attr("y", -20)
    .text("Artist's Top Albums")
    .style("fill", "#3E046C")
    .call(wrap, 30);

  //   Draw the arc
  albumArc
    .append("path")
    .attr("d", arc())
    .attr("fill", "none")
    .attr("stroke", "#3E046C");

  //   Draw the circles
  albumArc
    .selectAll("circle")
    .data(albums)
    .enter()
    .append("circle")
    .attr("id", (d) => d.album.replace(/[^a-zA-Z]/g, ""))
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 10) // You can adjust this as needed
    .style("fill", "#3E046C")
    .on("mousemove", function (event, d) {
      d3.select(this).attr("stroke", "black").attr("fill-opacity", "1");

      svg.selectAll("line").attr("opacity", 0);
      svg
        .selectAll("line#" + d.album.replace(/[^a-zA-Z]/g, ""))
        .attr("opacity", 1);

      d3.select("#tooltip")
        .html(
          "<b>Album: </b>" +
            d.album +
            "</br><b>Average Popularity: </b>" +
            d.popularity
        )
        .style("left", event.pageX + 25 + "px")
        .style("top", event.pageY + 10 + "px")
        .style("opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke", "none");
      svg.selectAll("line").attr("opacity", 0);
      d3.select("#tooltip")
        .style("opacity", 0)
        .style("left", 0 + "px")
        .style("top", 0 + "px");
    })
    .transition() // start transition
    .duration(2000) // transition duration
    .attr(
      "cx",
      (d) => radiusAlbum * Math.cos(angleScale(d.popularity) - Math.PI / 2)
    )
    .attr(
      "cy",
      (d) => radiusAlbum * Math.sin(angleScale(d.popularity) - Math.PI / 2)
    );

  const ticks = d3.range(min, 101, 10);

  // Add axis ticks
  albumArc
    .selectAll(".tick")
    .data(ticks)
    .enter()
    .append("text")
    .attr("x", (d) => radiusAlbum * Math.cos(angleScale(d) - Math.PI / 2))
    .attr("y", (d) => radiusAlbum * Math.sin(angleScale(d) - Math.PI / 2))
    .text((d) => d)
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .style("fill", "#3E046C")
    .attr("dominant-baseline", "middle")
    .attr("transform", (d) => {
      const angle = angleScale(d) - Math.PI / 2;
      const angleDegrees = angle * (180 / Math.PI);
      return `rotate(${angleDegrees}, ${
        radiusAlbum * Math.cos(angleScale(d) - Math.PI / 2)
      }, ${radiusAlbum * Math.sin(angleScale(d) - Math.PI / 2)})`;
    });

  //add arc for songs now

  var songsArc = svg
    .append("g")
    .attr(
      "transform",
      "translate(" + (radius - 250) + "," + (height / 2 +30) + ")"
    );

  songsArc
    .append("text")
    .attr("x", 400)
    .attr("y", -50)
    .text("Artist's Top Tracks")
    .style("fill", "#3E046C")
    .call(wrap, 30);

  //  Draw the arc
  songsArc
    .append("path")
    .attr("d", arcSongs())
    .attr("fill", "none")
    .attr("stroke", "#3E046C");

  let currentAlbum = null;

  // Draw the circles
  songsArc
    .selectAll("circle")
    .data(artistData)
    .enter()
    .append("circle")
    .attr("id", (d) => d["album name"].replace(/[^a-zA-Z]/g, ""))
    .attr("cx", 0)
    .attr("cy", 0)

    .attr("r", 5) // You can adjust this as needed
    .style("fill", "#3E046C")
    .on("mousemove", function (event, d) {
      d3.select(this).attr("stroke", "black").attr("fill-opacity", "1");

      svg.selectAll("line").attr("opacity", 0);
      svg
        .selectAll("line#" + d["album name"].replace(/[^a-zA-Z]/g, ""))
        .attr("opacity", 1);

      d3.select("#tooltip")
        .html(
          "<b>Song Name: </b>" +
            d.name +
            "</br><b>Album: </b>" +
            d["album name"] +
            "</br><b>Popularity: </b>" +
            d.popularity
        )
        .style("left", event.pageX + 25 + "px")
        .style("top", event.pageY + 10 + "px")
        .style("opacity", 1);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "none");
      if (currentAlbum !== d["album name"]) {
        svg
          .selectAll("line#" + d["album name"].replace(/[^a-zA-Z]/g, ""))
          .attr("opacity", 0);
      }
      d3.select("#tooltip")
        .style("opacity", 0)
        .style("left", 0 + "px")
        .style("top", 0 + "px");
    })
    .on("click", function (event, d) {
      var artistInfo = artistsData.filter((a) => a.name == d["artist name"]);
      console.log(d, artistInfo[0]);
      d3.select(".box").style("opacity", 1);
      d3.select("#imagePlaceholder").attr("src", artistInfo[0]["image_url"]);
      d3.select("#namePlaceholder").text(d["name"]);
      d3.select("#artistNamePlaceholder").text(d["artist name"]);
      var trackId = d.id;
      var iframeSrc = "https://open.spotify.com/embed/track/" + trackId;
      d3.select("#songSnpippet").attr("src", iframeSrc);
      d3.select("#textPlaceholder").text("Genres: " + artistInfo[0]["genres"]);

      if (currentAlbum === d["album name"]) {
        // If the clicked album is the current album, hide its links and clear currentAlbum
        svg
          .selectAll("line#" + currentAlbum.replace(/[^a-zA-Z]/g, ""))
          .attr("opacity", 0);
        currentAlbum = null;
      } else {
        // If the clicked album is not the current album, hide the current album's links
        if (currentAlbum) {
          svg
            .selectAll("line#" + currentAlbum.replace(/[^a-zA-Z]/g, ""))
            .attr("opacity", 0);
        }
        // Show the clicked album's links and update currentAlbum
        svg
          .selectAll("line#" + d["album name"].replace(/[^a-zA-Z]/g, ""))
          .attr("opacity", 1);
        currentAlbum = d["album name"];
      }

      //add chart
      // Extract the necessary attributes
      let data = {
        acousticness: parseFloat(d.acousticness),
        danceability: parseFloat(d.danceability),
        energy: parseFloat(d.energy),
        liveness: parseFloat(d.liveness),
        valence: parseFloat(d.valence),
      };
      //remove previous bars
      d3.select("#chartContainer svg").remove();
      d3.select("#popularityBar svg").remove();

      // Convert data to an array
      let dataArr = Object.entries(data).map(([key, value]) => ({
        attribute: key,
        value: value,
      }));
      // Create the SVG
      var margin = { top: 10, right: 30, bottom: 60, left: 40 },
        width = 400 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;
      let svg_new = d3
        .select("#chartContainer")
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

      // Set the scales
      let x = d3
        .scaleBand()
        .domain(dataArr.map((d) => d.attribute))
        .range([0, width])
        .padding(0.1);

      let y = d3
        .scaleLinear()
        .domain([0, d3.max(dataArr, (d) => d.value)])
        .range([height, 0]);

      // Draw the bars
      svg_new
        .selectAll(".bar")
        .data(dataArr)
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("class", "bar")
              .attr("fill", "#3E046C")
              .attr("rx", 10)
              .attr("x", (d) => x(d.attribute))
              .attr("y", height) // initially set y to height
              .attr("width", x.bandwidth())
              .attr("height", 0) // initially set height to 0
              .transition() // apply a transition
              .duration(1000) // apply it over 1000 milliseconds
              .attr("y", (d) => y(d.value)) // transition y to its final value
              .attr("height", (d) => height - y(d.value)), // transition height to its final value
          (update) => update,
          (exit) => exit.remove()
        );

      // Add the axes
      svg_new
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end");

      svg_new.append("g").call(d3.axisLeft(y));

      //add popularity bar
      // Your total and actual values
      let total = 100;
      let popularity = parseInt(d.popularity); // Get the popularity from your jsonData

      // Create the SVG
      let svgBar = d3
        .select("#popularityBar")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + 500 + " " + 50)
        .append("g")
        .attr("transform", "translate(" + 20 + "," + 0 + ")");

      // Draw the total bar
      svgBar
        .append("rect")
        .attr("width", 460)
        .attr("height", 30)
        .attr("rx", 10) // Add this line to round the rectangle's corners
        .style("fill", "#ddd"); // Light gray color

      // Draw the popularity bar
      svgBar
        .append("rect")
        .attr("width", 0) // Calculate width based on popularity percentage
        .attr("height", 30)
        .attr("rx", 10) // Add this line to round the rectangle's corners
        .style("fill", "firebrick")
        .transition() // apply a transition
        .duration(1000)
        .attr("width", 460 * (popularity / total)) // Calculate width based on popularity percentage
        .attr("height", 30);
    })
    .transition() // start transition
    .duration(2000) // transition duration
    .attr(
      "cx",
      (d) => radiusSongs * Math.cos(angleScale(d.popularity) - Math.PI / 2)
    )
    .attr(
      "cy",
      (d) => radiusSongs * Math.sin(angleScale(d.popularity) - Math.PI / 2)
    );

  // Add axis ticks
  songsArc
    .selectAll(".tick")
    .data(ticks)
    .enter()
    .append("text")
    .attr("x", (d) => radiusSongs * Math.cos(angleScale(d) - Math.PI / 2))
    .attr("y", (d) => radiusSongs * Math.sin(angleScale(d) - Math.PI / 2))
    .text((d) => d)
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("transform", (d) => {
      const angle = angleScale(d) - Math.PI / 2;
      const angleDegrees = angle * (180 / Math.PI);
      return `rotate(${angleDegrees}, ${
        radiusSongs * Math.cos(angleScale(d) - Math.PI / 2)
      }, ${radiusSongs * Math.sin(angleScale(d) - Math.PI / 2)})`;
    });
}
