const XMAX = 20000;

const svg_handlers = {
  plot_genomes: (svg_tag, data) => {
    const genome_count = data.length;
    let ycoef = 5;

    const width = 700,
      height = 500;
    const margin = { top: 20, buttom: 10, left: 5, right: 10 };

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

    let xAxis = d3.axisBottom().scale(X).tickSizeInner(0).tickSizeOuter(0);
    let axises_g = svg.append("g");

    axises_g
      .selectAll("x-axis")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "x-axis")
      .attr("id", (d, i) => "xa-" + d.id)
      .attr("transform", (d, i) => `translate(0,${Y(ycoef * i + 2)})`)
      .call(xAxis);
  },
};

svg_handlers.plot_genomes("alignment-svg", data);
