const XMAX = 12000;

const svg_handlers = {
  plot_genomes: (svg_tag, data) => {
    const genome_count = data.genomes.length;
    let ycoef = 11;

    const width = 1000,
      height = 600;
    const margin = { top: 20, buttom: 10, left: 50, right: 10 };
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
      .ticks(20, ".1s")
      .tickSizeInner(3)
      .tickSizeOuter(0);

    let xAxisGrid = d3
      .axisBottom()
      .scale(X)
      .tickFormat("")
      .tickSize(inner_height)
      .ticks(20, ".1s");

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
    let guides = svg.append("g").attr("id", "guides");
    let blocks = svg.append("g").attr("id", "blocks");
    let orfs = svg.append("g").attr("id", "orfs");

    set_block_color(data.blocks);

    guides
      .selectAll(".guide")
      .data(data.genomes)
      .enter()
      .append("g")
      .attr("class", "guide")
      .append("line")
      .attr("class", "ge-line")
      .attr("x1", X(0))
      .attr("y1", (d) => Y(seqYaxis[d.id]))
      .attr("x2", X(XMAX))
      .attr("y2", (d) => Y(seqYaxis[d.id]))
      .style("stroke", "#bdbdbd")
      .style("stroke-width", 2)
      .style("stroke-linecap", "round");

    guides
      .selectAll(".guide")
      .append("text")
      .attr("class", "seq-title")
      .attr("transform", (d) => `translate(0,${Y(seqYaxis[d.id] - 0.2)})`)
      .text((d) => d.name);

    guides
      .selectAll(".guide")
      .append("text")
      .attr("class", "strand")
      .attr(
        "transform",
        (d) => `translate(${X(XMAX)},${Y(seqYaxis[d.id] + 2)})`
      )
      .text("\uf060 R");
    guides
      .selectAll(".guide")
      .append("text")
      .attr("class", "strand")
      .attr(
        "transform",
        (d) => `translate(${X(XMAX)},${Y(seqYaxis[d.id] - 1)})`
      )
      .text("\uf061 F");

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

    d3.map(data.annotations, function (d) {
      if (d.strand == "-") {
        let _tmp = d.sidx;
        d.sidx = d.eidx;
        d.eidx = _tmp;
      }
    });
    const xVisibleMax = X(XMAX);
    const CHAR_SPACE = 5;

    orfs
      .selectAll(".orf")
      .data(data.annotations)
      .enter()
      .append("path")
      .attr("id", (d) => `orfs-${d.sample}_${d.accession}`)
      .attr("class", (d) => "orf " + (d.refdb ? d.refdb : "other"))
      .attr("d", (d) =>
        getPath(
          { x: X(d.sidx), y: Y(seqYaxis[d.id] - 1) },
          { x: X(d.eidx), y: Y(seqYaxis[d.id] - 1) },
          14,
          14,
          4
        )
      )
      .attr("transform", function (d) {
        d.rnd = Math.random();
        let bais = Math.floor(Math.abs((d.rnd * 10) % 2) + 2);

        return transform_ORFs(
          { x: X(d.sidx), y: Y(seqYaxis[d.id] - bais) },
          { x: X(d.eidx), y: Y(seqYaxis[d.id] - bais) }
        );
      });
    orfs
      .selectAll(".orf-label")
      .data(data.annotations)
      .enter()
      .append("text")
      .attr("class", "orf-label")
      .attr("transform", function (d) {
        if (!d.stitle) return;
        let bais = Math.floor(Math.abs(((d.rnd * 10) % 2) + 2));
        return getTextTransform(
          d,
          Y(seqYaxis[d.id] - bais),
          d.stitle.length,
          xVisibleMax
        );
      })
      .attr("display", (d) => (textFits(d, xVisibleMax) ? null : "none"))
      .text((d) => d.stitle);

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
      return links;
    }

    function transform(d) {
      genome_idx = seqYaxis[d.id];
      let l = d.l;
      let bias = l < 0 ? -3 : -8.5;
      let x = X(Math.abs(l)) - X(0),
        y = Y(genome_idx + bias);

      d.midx = x + X(Math.abs(d.l - d.r) / 2);
      d.midy = y;

      return "translate(" + x + "," + y + ")";
    }

    function set_block_color(blocks) {
      let palette = [
        "#e7c6ff",
        "#E0144C",
        "#80ed99",
        "#9bb1ff",
        "#d4a373",
        "#606c38",
        "#fcbf49",
        "#2a9d8f",
        "#219ebc",
        "#8338ec",
        "#588157",
        "#f15bb5",
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

    function getPath(from, to, lineWidth, arrowheadWidth, arrowheadLength) {
      var dx = to.x - from.x;
      var dy = to.y - from.y;

      // Calculate the length of the line
      var len = Math.sqrt(dx * dx + dy * dy);
      let dW = arrowheadWidth - lineWidth;
      if (len < arrowheadLength) {
        var d = [
          "M",
          0,
          0,
          "V",
          lineWidth / 2,
          "H",
          0.5 * dx,
          "V",
          -lineWidth / 2,
          "H",
          0,
          "V",
          0,
          "Z",
        ];
        return d.join(" ");
      } else {
        // The difference between the line width and the arrow width
        let dW = arrowheadWidth - lineWidth;
        // The angle of the line
        var angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Generate a path describing the arrow. For simplicity we define it as a
        // horizontal line of the right length, and starting at 0,0. Then we rotate
        // and move it into place with a transform attribute.

        var d = [
          "M",
          0,
          -lineWidth / 2,
          "h",
          len - arrowheadLength,
          "v",
          -dW / 2,
          "L",
          len,
          0,
          "L",
          len - arrowheadLength,
          arrowheadWidth / 2,
          "v",
          -dW / 2,
          "H",
          0,
          "Z",
        ];
      }

      return d.join(" ");
    }

    function transform_ORFs(from, to) {
      // rotate the arrow if it represent an ORF in reverse strand
      var dx = to.x - from.x;
      var dy = to.y - from.y;
      var angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      var scaleTxt = angle === 180 ? "scale(-1, 1)" : "";
      return "translate(" + from.x + "," + from.y + ") " + scaleTxt;
    }
    function getTextTransform(d, ydt, textlen, maxAxis) {
      let leftPoint = Math.min(X(d.eidx), X(d.sidx));
      let rightPoint = Math.max(X(d.eidx), X(d.sidx));
      leftPoint = Math.max(0, leftPoint);
      rightPoint = Math.min(rightPoint, maxAxis);
      let xtr = leftPoint + Math.abs(rightPoint - leftPoint) / 4;
      return (
        "translate(" +
        (xtr - 0.5 * textlen * CHAR_SPACE) +
        "," +
        (ydt + 3) +
        ")"
      );
    }
    function textFits(d, maxAxis) {
      if (!d.stitle) return false;

      let leftPoint = Math.max(0, Math.min(X(d.eidx), X(d.sidx)));
      let rightPoint = Math.min(Math.max(X(d.eidx), X(d.sidx)), maxAxis);
      let visibleLength = rightPoint - leftPoint;
      return d.stitle.length * CHAR_SPACE < visibleLength;
    }
  },
};

svg_handlers.plot_genomes("alignment-svg", data);
