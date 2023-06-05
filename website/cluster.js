function CreateCluster(data) {
  // Set the dimensions and margins of the graph
  var margin = { top: 10, right: 10, bottom: 10, left: 10 },
    width = 600 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  data = data.filter((d) => +d.popularity >= 50);

  // Append the svg object to the body of the page
  var svg = d3
    .select("#cluster")
    .append("svg")
    .style("text-align", "center")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr(
      "viewBox",
      "0 0 " +
        (width + margin.left + margin.right) +
        " " +
        (height + margin.top + margin.bottom)
    )
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + -100 + ")");

  var n = 1000, // total number of circles
    m = 7; // number of distinct clusters

  var color = d3
    .scaleOrdinal()
    .range([
      "#3E046C",
      "#950069",
      "#D1345B",
      "#F5754C",
      "#FFB74B",
      "#F9F871",
      "#00A8E8",
    ]);

  drag = (simulation) => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  function centroid(nodes) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (const d of nodes) {
      let k = d.r ** 2;
      x += d.x * k;
      y += d.y * k;
      z += k;
    }
    return { x: x / z, y: y / z };
  }

  var jsonData = {
    children: [],
  };

  var scale = d3
    .scaleLog()
    .domain(d3.extent(data, (d) => +d.popularity))
    .range([10, 100]);

  console.log(d3.extent(data, (d) => +d.popularity));

  // Group the data by the 'Cluster' column
  var groupedData = d3.group(data, (d) => d.Cluster);

  // Iterate over the grouped data and create the JSON structure
  groupedData.forEach(function (group) {
    var children = [];
    group.forEach(function (d) {
      children.push({
        group: +d.Cluster,
        value: scale(+d.popularity),
        popularity: +d.popularity,
        id: d.id,
        name: d.name,
      });
    });
    jsonData.children.push({
      children: children,
    });
  });
  data = jsonData;

  pack = () =>
    d3.pack().size([width, height]).padding(1)(
      d3.hierarchy(data).sum((d) => d.value)
    );

  function forceCollide() {
    const alpha = 0.4; // fixed for greater rigidity!
    const padding1 = 2; // separation between same-color nodes
    const padding2 = 10; // separation between different-color nodes
    let nodes;
    let maxRadius;

    function force() {
      const quadtree = d3.quadtree(
        nodes,
        (d) => d.x,
        (d) => d.y
      );
      for (const d of nodes) {
        const r = d.r + maxRadius;
        const nx1 = d.x - r,
          ny1 = d.y - r;
        const nx2 = d.x + r,
          ny2 = d.y + r;
        quadtree.visit((q, x1, y1, x2, y2) => {
          if (!q.length)
            do {
              if (q.data !== d) {
                const r =
                  d.r +
                  q.data.r +
                  (d.data.group === q.data.data.group ? padding1 : padding2);
                let x = d.x - q.data.x,
                  y = d.y - q.data.y,
                  l = Math.hypot(x, y);
                if (l < r) {
                  l = ((l - r) / l) * alpha;
                  (d.x -= x *= l), (d.y -= y *= l);
                  (q.data.x += x), (q.data.y += y);
                }
              }
            } while ((q = q.next));
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      }
    }

    force.initialize = (_) =>
      (maxRadius =
        d3.max((nodes = _), (d) => d.r) + Math.max(padding1, padding2));

    return force;
  }

  function forceCluster() {
    const strength = 0.2;
    let nodes;

    function force(alpha) {
      const centroids = d3.rollup(nodes, centroid, (d) => d.data.group);
      const l = alpha * strength;
      for (const d of nodes) {
        const { x: cx, y: cy } = centroids.get(d.data.group);
        d.vx -= (d.x - cx) * l;
        d.vy -= (d.y - cy) * l;
      }
    }

    force.initialize = (_) => (nodes = _);

    return force;
  }

  const nodes = pack().leaves();

  const simulation = d3
    .forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.01))
    .force("y", d3.forceY(height / 2).strength(0.01))
    .force("cluster", forceCluster())
    .force("collide", forceCollide());
  d3.select("#songSnpippetCluster").style("opacity", 0);

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", (d) => color(d.data.group))
    .on("mousemove", function (event, d) {
      d3.select(this).attr("stroke", "black").attr("fill-opacity", "1");

      d3.select("#tooltip")
        .html(
          "<b>Name: </b>" +
            d.data.name +
            "</br><b>Cluster: </b>" +
            d.data.group +
            "</br><b>Popularity: </b>" +
            d.data.popularity
        )
        .style("left", event.pageX + 25 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke", "none");
      d3.select("#tooltip")
        .style("opacity", 0)
        .style("left", 0 + "px")
        .style("top", 0 + "px");
    })
    .on("click", function (event, d) {
      var trackId = d.data.id;
      var iframeSrc = "https://open.spotify.com/embed/track/" + trackId;
      d3.select("#songSnpippetCluster").style("opacity", 1);
      d3.select("#songSnpippetCluster").attr("src", iframeSrc);
    })
    .call(drag(simulation));

  node
    .transition()
    .delay((d, i) => Math.random() * 500)
    .duration(750)
    .attrTween("r", (d) => {
      const i = d3.interpolate(0, d.r);
      return (t) => (d.r = i(t));
    });

  simulation.on("tick", () => {
    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });
}
