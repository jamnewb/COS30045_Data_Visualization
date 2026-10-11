const dataset = [
    { country: "2016", healthcareWorkersPerCapita: 13.46, lifeExpectancy: 79.82, physicians: 51200, nurses: 184037, others: 82333, population: 23594471 },
    { country: "2017", healthcareWorkersPerCapita: 13.46, lifeExpectancy: 80, physicians: 51353, nurses: 184587, others: 82579, population: 23665024 },
    { country: "2018", healthcareWorkersPerCapita: 13.46, lifeExpectancy: 80.19, physicians: 51486, nurses: 185064, others: 82793, population: 23726185 },
	{ country: "2019", healthcareWorkersPerCapita: 13.46, lifeExpectancy: 80.36, physicians: 51598, nurses: 185466, others: 82972, population: 23777737 },
    { country: "2020", healthcareWorkersPerCapita: 13.46, lifeExpectancy: 80.53, physicians: 51693, nurses: 185807, others: 83125, population: 23821464 },
];

const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 500 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#map")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

const projection = d3.geoMercator().scale(100).translate([width / 2, height / 1.5]);
const path = d3.geoPath().projection(projection);

const color = d3.scaleQuantize()
    .domain([d3.min(dataset, d => d.healthcareWorkersPerCapita), d3.max(dataset, d => d.healthcareWorkersPerCapita)])
    .range(d3.schemeBlues[9]);

d3.json("oceania.json").then(world => {
    svg.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const countryData = dataset.find(data => data.country === d.properties.name);
            return countryData ? color(countryData.healthcareWorkersPerCapita) : "#ccc";
        })
        .on("mouseover", (event, d) => {
            const countryData = dataset.find(data => data.country === d.properties.name);
            if (countryData) {
                tooltip
                    .html(`
                        <strong>${countryData.country}</strong><br>
                        Healthcare Workers per 1000: ${countryData.healthcareWorkersPerCapita}<br>
                        Life Expectancy: ${countryData.lifeExpectancy} years<br>
                        <br>
                        <svg width="120" height="120" style="font: 6.5px sans-serif;">
                            ${createPieChart([
                                { key: 'Physicians', value: countryData.physicians },
                                { key: 'Nurses', value: countryData.nurses },
                                { key: 'Others', value: countryData.others },
                                { key: 'Population', value: countryData.population }
                            ])}
                        </svg>
                    `)
                    .style("visibility", "visible")
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY - 50}px`);
            }
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"))
        .on("click", (event, d) => {
            const countryData = dataset.find(data => data.country === d.properties.name);
            if (countryData) {
                updateBarChart(countryData);
            }
        });
});

function createPieChart(data) {
    const radius = 60;
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const color = d3.scaleOrdinal().domain(data.map(d => d.key)).range(d3.schemeCategory10);
    const arcs = pie(data);
    return arcs.map(d => {
        const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100;
        return `
            <g transform="translate(${radius}, ${radius})">
                <path d="${arc(d)}" fill="${color(d.data.key)}"></path>
                <text transform="translate(${arc.centroid(d)[0] * 1.5}, ${arc.centroid(d)[1] * 1.5})" text-anchor="middle">${d.data.key}</text>
                <text transform="translate(${arc.centroid(d)[0] * 0.5}, ${arc.centroid(d)[1] * 0.5})" text-anchor="middle">${percentage.toFixed(1)}%</text>
            </g>
        `;
    }).join('');
}

function updateBarChart(countryData) {
    d3.select("#barchart").html("");
    const barChartSvg = d3.select("#barchart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const categories = ['physicians', 'nurses', 'others', 'population'];
    const values = [countryData.physicians, countryData.nurses, countryData.others, countryData.population];

    const x = d3.scaleBand()
        .domain(categories)
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .nice()
        .range([height, 0]);

    barChartSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    barChartSvg.append("g")
        .call(d3.axisLeft(y));

    barChartSvg.selectAll(".bar")
        .data(categories)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d))
        .attr("y", d => y(countryData[d]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(countryData[d]))
        .attr("fill", "steelblue");
}

function updateLineChart(category) {
    d3.select("#linechart").html("");
    const lineChartSvg = d3.select("#linechart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(dataset.map(d => d.country))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d[category])])
        .nice()
        .range([height, 0]);

    lineChartSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    lineChartSvg.append("g")
        .call(d3.axisLeft(y));

    const line = d3.line()
        .x(d => x(d.country))
        .y(d => y(d[category]));

    lineChartSvg.append("path")
        .datum(dataset)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    lineChartSvg.selectAll(".dot")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.country))
        .attr("cy", d => y(d[category]))
        .attr("r", 5)
        .attr("fill", "steelblue");
}

d3.select("#lineGraphBtn").on("click", () => {
    d3.selectAll(".chart-container").style("display", "inline-block");
    updateLineChart('nurses');
});

d3.select("#nursesBtn").on("click", () => updateLineChart('nurses'));
d3.select("#physiciansBtn").on("click", () => updateLineChart('physicians'));
d3.select("#othersBtn").on("click", () => updateLineChart('others'));
d3.select("#populationBtn").on("click", () => updateLineChart('population'));
