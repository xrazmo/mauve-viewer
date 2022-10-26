const XMAX = 22500;

const svg_handlers = {
  plot_genomes: (svg_tag, data) => {
    const genome_count = data.genomes.length;
    let ycoef = 5;

    const width = 700,
      height = 500;
    const margin = { top: 30, buttom: 10, left: 10, right: 10 };

    const svg = d3
      .select("#" + svg_tag)
      .attr("viewBox", [0, 0, width, height])
      .attr("xmlns", `xmlns="http://www.w3.org/2000/svg"`);

    let ymax = ycoef * genome_count;
    let X = d3
      .scaleLinear()
      .domain([0, XMAX])
      .range([margin.left, width - margin.right]);

    let Y = d3
      .scaleLinear()
      .domain([0, ymax])
      .range([0, height - margin.top - margin.buttom]);

    let xAxis = d3
      .axisBottom()
      .scale(X)
      .ticks(20, ".1s")
      .tickSizeInner(3)
      .tickSizeOuter(0);

    let axises_g = svg.append("g");
    let seqYaxis = {};

    axises_g
      .selectAll("x-axis")
      .data(data.genomes)
      .enter()
      .append("g")
      .attr("class", "x-axis")
      .attr("id", (d) => "xa-" + d.id)
      .attr("transform", function (d, i) {
        seqYaxis[d.id] = ycoef * i + 2;
        return `translate(0,${Y(ycoef * i + 2)})`;
      })
      .call(xAxis);

    let blocks = svg.append("g").attr("id", "blockes");

    set_block_color(data.blocks);

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
      .attr("height", 20)
      .attr("transform", (d) => transform(d))
      .style("stroke-width", 0.5)
      .style("stroke", (d) => d.cl)
      .style("fill-opacity", 0.3)
      .style("fill", (d) => d.cl);

    // function get_block(d) {
    //   console.log(d);
    //   let r = 1;
    //   let w = X(Math.abs(d.l - d.r));
    //   let path = [
    //     "M0 0",
    //     `a${r} ${r} 0 0 1 ${r} -${r}`,
    //     `h ${w}`,
    //     `a${r} ${r} 0 0 1 ${r} ${r}`,
    //     "v 20",
    //     `a${r} ${r} 0 0 1 -${r} ${r}`,
    //     `h -${w}`,
    //     `a${r} ${r} 0 0 1 -${r} -${r}`,
    //     "z",
    //   ];
    //   return path.join(" ");
    // }

    function transform(d) {
      genome_idx = seqYaxis[d.id];
      let l = d.l;
      let sig = l < 0 ? 0.3 : -2;
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
        "#cbf3f0",
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
