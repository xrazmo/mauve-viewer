const XMAX = 22500;

const svg_handlers = {
  plot_genomes: (svg_tag, data) => {
    const genome_count = data.genomes.length;
    let ycoef = 11;

    const width = 700,
      height = 600;
    const margin = { top: 20, buttom: 10, left: 10, right: 10 };
    const inner_height = height - margin.top - margin.buttom;
    const inner_width = width - margin.right;
    const svg = d3
      .select("#" + svg_tag)
      .attr("viewBox", [0, 0, width, height])
      .attr("xmlns", `xmlns="http://www.w3.org/2000/svg"`);

    let ymax = ycoef * genome_count;
    let X = d3
      .scaleLinear()
      .domain([0, XMAX])
      .range([margin.left, inner_width]);

    let Y = d3
      .scaleLinear()
      .domain([0, ymax])
      .range([margin.top, inner_height]);

    let xAxis = d3
      .axisBottom()
      .scale(X)
      .ticks(10, ".1s")
      .tickSizeInner(3)
      .tickSizeOuter(0);

    let xAxisGrid = d3
      .axisBottom()
      .scale(X)
      .tickFormat("")
      .tickSize(inner_height)
      .ticks(10, ".1s");

    let axises_g = svg.append("g");
    let seqYaxis = {};
    let i = 0;
    for (const d of data.genomes) {
      seqYaxis[d.id] = ycoef * i + 5;
      i += 1;
    }
    axises_g
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + inner_height + ")")
      .call(xAxis);

    axises_g
      .append("g")
      .attr("class", "x axis-grid")
      .attr("transfrom", `translate(0,-${inner_height})`)
      .call(xAxisGrid);

    let blocks = svg.append("g").attr("id", "blockes");

    set_block_color(data.blocks);
    console.log(Object.values(seqYaxis));
    blocks
      .selectAll(".mid-line")
      .data(Object.values(seqYaxis))
      .enter()
      .append("line")
      .attr("class", "mid-line")
      .attr("x1", X(0))
      .attr("y1", (d) => Y(d))
      .attr("x2", X(XMAX))
      .attr("y2", (d) => Y(d))
      .style("stroke", "#bdbdbd")
      .style("stroke-width", 3)
      .style("stroke-linecap", "round");

    blocks
      .selectAll("block")
      .data(data.blocks)
      .enter()
      .append("rect")
      .attr("class", "block")
      .attr("name", (d) => d.n)
      .attr("rx", 1)
      .attr("ry", 1)
      .attr("x", X(0))
      .attr("y", Y(0))
      .attr("width", (d) => X(Math.abs(d.l - d.r)) - X(0))
      .attr("height", 25)
      .attr("transform", (d) => transform(d))
      .style("stroke-width", 0.5)
      .style("stroke", (d) => d.cl)
      .style("fill-opacity", 0.1)
      .style("fill", (d) => d.cl);

    function transform(d) {
      genome_idx = seqYaxis[d.id];
      let l = d.l;
      let sig = l < 0 ? -2.5 : -8;
      let x = X(Math.abs(l)) - X(0),
        y = Y(genome_idx + sig);
      return "translate(" + x + "," + y + ")";
    }

    function set_block_color(blocks) {
      let palette = [
        "#d4a373",
        "#606c38",
        "#fcbf49",
        "#2a9d8f",
        "#219ebc",
        "#8338ec",
        "#588157",
        "#f15bb5",
        "#e7c6ff",
        "#E0144C",
        "#80ed99",
        "#9bb1ff",
      ];
      let cl_blocks = {};
      used_cl = 0;
      for (const b of blocks) {
        if (b.n in cl_blocks) {
          b.cl = cl_blocks[b.n];
        } else {
          b.cl = used_cl >= palette.length ? get_rnd_color() : palette[used_cl];
          cl_blocks[b.n] = b.cl;
          used_cl += 1;
        }
      }
    }

    function get_rnd_color() {
      return "#" + Math.floor(Math.random() * 16777215).toString(16);
    }
  },
};

svg_handlers.plot_genomes("alignment-svg", data);
