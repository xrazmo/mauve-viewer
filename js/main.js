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

    let links = svg.append("g").attr("id", "links");
    let blocks = svg.append("g").attr("id", "blocks");
    let ge_lines = svg.append("g").attr("id", "ge_lines");

    set_block_color(data.blocks);

    ge_lines
      .selectAll(".ge-line")
      .data(Object.values(seqYaxis))
      .enter()
      .append("line")
      .attr("class", "ge-line")
      .attr("x1", X(0))
      .attr("y1", (d) => Y(d))
      .attr("x2", X(XMAX))
      .attr("y2", (d) => Y(d))
      .style("stroke", "#bdbdbd")
      .style("stroke-width", 2)
      .style("stroke-linecap", "round");

    blocks
      .selectAll("block")
      .data(data.blocks)
      .enter()
      .append("rect")
      .attr("class", (d) => "block " + d.n)
      .attr("id", (d) => `${d.id}-${d.n}`)
      .attr("rx", 1)
      .attr("ry", 1)
      .attr("x", X(0))
      .attr("y", Y(0))
      .attr("width", (d) => X(Math.abs(d.l - d.r)) - X(0))
      .attr("height", 25)
      .attr("transform", (d) => transform(d))
      .style("stroke-width", 0.9)
      .style("stroke", (d) => d.cl)
      .style("fill-opacity", 0.1)
      .style("fill", (d) => d.cl)
      .style("cursor", "pointer")
      .on("mouseover", function (e) {
        let block = d3.select(this).attr("class").split(" ")[1];
        blocks.selectAll(`.block`).style("fill-opacity", 0.2);
        blocks.selectAll(`.block`).style("stroke-width", 0.2);

        blocks.selectAll(`.${block}`).style("fill-opacity", 0.5);
        blocks.selectAll(`.${block}`).style("stroke-width", 0.9);

        links.selectAll(`.link`).style("stroke-width", 0.1);
        links.selectAll(`.${block}`).style("stroke-width", 1);
      })
      .on("mouseleave", function (e) {
        blocks.selectAll(`.block`).style("fill-opacity", 0.2);
        links.selectAll(`.link`).style("stroke-width", 0.5);
        blocks.selectAll(`.block`).style("stroke-width", 0.9);
      });

    links
      .selectAll(".link")
      .data(create_links(data.blocks))
      .join("path")
      .attr("class", (d) => "link " + d.name)
      .attr("d", d3.linkVertical())
      .attr("fill", "none")
      .attr("stroke", (d) => d.cl)
      .attr("stroke-width", 0.5);

    function create_links(blocks) {
      let links = [];
      src_b = blocks[0];
      let i = 1;
      while (i < blocks.length) {
        dist_b = blocks[i];
        if (src_b.n == dist_b.n) {
          sd = fetch_data(src_b);
          dd = fetch_data(dist_b);
          links.push({
            source: [sd.midx, sd.midy + Y(0) + 25],
            target: [dd.midx, dd.midy + Y(0)],
            cl: src_b.cl,
            name: src_b.n,
          });
        }
        src_b = dist_b;
        i += 1;
      }

      function fetch_data(d) {
        return d3.select(`#${d.id}-${d.n}`).data()[0];
      }

      // for (let it in pairs) {
      //   let src = get_node(pairs[it][0]).attr("opacity", 0.96);
      //   let trg = get_node(pairs[it][1]).attr("opacity", 0.96);
      //   let src_d = src.data()[0];
      //   let trg_d = trg.data()[0];
      //   if (src_d.t == "g" && trg_d.t == "r") {
      //     srcX = src_d.size + wspace;
      //     trgX = 0;
      //   } else if (src_d.t == "g" && trg_d.t == "a") {
      //     srcX = 0;
      //     trgX = trg_d.size + wspace;
      //   } else if (src_d.t == "a" && trg_d.t == "g") {
      //     srcX = src_d.size + wspace;
      //     trgX = 0;
      //   } else if (src_d.t == "r" && trg_d.t == "g") {
      //     srcX = 0;
      //     trgX = trg_d.size + wspace;
      //   }
      //   links.push({
      //     source: [src_d.x + srcX, src_d.y + 8],
      //     target: [trg_d.x + trgX, trg_d.y + 8],
      //   });
      // }
      return links;
    }

    function transform(d) {
      genome_idx = seqYaxis[d.id];
      let l = d.l;
      let bias = l < 0 ? -2.5 : -8;
      let x = X(Math.abs(l)) - X(0),
        y = Y(genome_idx + bias);

      d.midx = x + X(Math.abs(d.l - d.r) / 2);
      d.midy = y;

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
