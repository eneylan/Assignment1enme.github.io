let currentData = [];
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 1400 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
//const colorScale = d3.scaleOrdinal(continents, d3.schemeSet2);
const stateNames = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", GU: "Guam", VI: "U.S. Virgin Islands", MP: "Northern Mariana Islands",
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec"
};

const options3 = [
    "Min Temperature (°F)",
    "Max Temperature (°F)",
    "Average Temperature (°F)",
    "Average Wind Speed (mph)",
    "Direction of Fastest Wind Gust (°)",
    "Fastest Wind Gust (mph)",
    "Snowfall (in)",
    "Snow Depth (in)",
    "Precipitation (in)"
];
const t = 1000;
const options = ['TMIN', 'TMAX', 'TAVG', 'AWND', 'WDF5', 'WSF5', 'SNOW', 'SNWD', 'PRCP']
const options2 = ['state']
let currstates = []
const colorOptions = ["pink", "orange", "green", "red", "purple"]
let colorCode = []
let opencolor = 0

let allData = []
let xScale, yScale, linexScale, lineyScale

let xVar = 'state', yVar = 'TMAX', targetYear

const ignore = x => x === "" ? NaN : +x;

function init(){
    d3.csv("./data/weather.csv", d => ({
        station: d.station,
        state: d.state,
        latitude: +d.latitude,
        longitude: +d.longitude,
        elevation: +d.elevation,
        date: d3.timeParse("%Y%m%d")(d.date),
        TMIN: ignore(d.TMIN),
        TMAX: ignore(d.TMAX),
        TAVG: ignore(d.TAVG),
        AWND: ignore(d.AWND),
        WDF5: ignore(d.WDF5),
        WSF5: ignore(d.WSF5),
        SNOW: ignore(d.SNOW),
        SNWD: ignore(d.SNWD),
        PRCP: ignore(d.PRCP)
    }))
    .then(data => {
            console.log(data)
            allData = data
            setupSelector()
            updateAxes()
            updateVis()
            addLegend()
            updateLineAxes()
            updateLine()
        })
    .catch(error => console.error('Error loading data:', error));
}

function updateLine() {
    const newData = returnLines();
    const makeline = d3.line()
        .x(d => linexScale(d.date))
        .y(d => lineyScale(d.value));
    linesvg.selectAll('.line')
        .data(newData, d => d.state)
        .join(
            function(enter) {
                return enter
                .append('path')
                .attr('class', 'line')
                .attr("d", d => makeline(d.value))
                .attr("fill", "none")
                .attr("stroke",  d => colorCode.find(x => x.state === d.state).color)
                .attr("stroke-width", 2);
            },
            function(update) {
                return update
                .attr("d", d => makeline(d.value));
            },
            function(exit) {
                exit
                .remove()
            }
        )
}

function updateLineAxes() {
    linesvg.selectAll('.axis').remove()
    linesvg.selectAll('.labels').remove()
    const newData = returnLines();
    linexScale = d3.scaleTime()
        .domain(d3.extent(allData, d => d.date))
        .range([0, width]);
    lineyScale = d3.scaleLinear()
        .domain([d3.min(newData, x => d3.min(x.value, d => d.value)), d3.max(newData, x => d3.max(x.value, d => d.value))])
        .range([height, 0]);
    const linexAxis = d3.axisBottom(linexScale)
    const lineyAxis = d3.axisLeft(lineyScale)
    linesvg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(linexAxis);
        
    linesvg.append('g')
        .attr('class', 'axis')
        .call(lineyAxis);

    linesvg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text(xVar)
        .attr('class', 'labels')

    linesvg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 40)
        .attr("text-anchor", "middle")
        .text(yVar)
        .attr('class', 'labels')
}

function setupSelector(){
    
    const [mind, maxd] = d3.extent(allData, d => d.date);
    targetYear = +mind;
    d3.select("#date").property("value", d3.timeFormat("%Y-%m-%d")(new Date(mind)))
        .on("change", function() {
            const val = d3.timeParse("%Y-%m-%d")(this.value);
            targetYear = +val
            slider.value(val);
            updateAxes()
            updateVis()
            updateLineAxes()
            updateLine()
        });
    let slider = d3.sliderHorizontal()
        .min(mind)
        .max(maxd)
        .step(24 * 60 * 60 * 1000)
        .width(width)
        .displayValue(false)
        .tickFormat(d3.timeFormat("%B"))
        .on('onchange', (val) => {
            targetYear = +d3.timeDay.floor(new Date(val))
            d3.select("#date").property("value", d3.timeFormat("%Y-%m-%d")(new Date(val)))
            updateAxes()
            updateVis()
            updateLineAxes()
            updateLine()
        });

    d3.select('#slider')
        .append('svg')
        .attr('width', width +80)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);
    
    d3.selectAll('.variable')
    .each(function() {
        if (this.id == "xVariable") {
            d3.select(this).selectAll('myOptions').data(options2).enter().append("option").text((d, i) => options2[i]).attr("value",d => d)
        } else if (this.id == "yVariable"){
            d3.select(this).selectAll('myOptions').data(options).enter().append("option").text((d, i) => options3[i]).attr("value",d => d)
        }
        d3.select(this).selectAll('myOptions')
        .enter()
        .append('option')
        .attr("value",d => d)})
        .on("change", function (event) {
        
            const id = d3.select(this).property("id")
            const value = d3.select(this).property("value")
            if (id == "xVariable") {
                xVar = value;
            } else if (id == "yVariable") {
                yVar = value;
            }
            updateAxes();
            updateVis();
            updateLineAxes();
            updateLine();
        })
d3.select('#xVariable').property('value', xVar)
d3.select('#yVariable').property('value', yVar)
}

function updateAxes(){
    let newcurr = returnbars();
    svg.selectAll('.axis').remove()
    svg.selectAll('.labels').remove()
    if (xVar == "station") {
        xScale = d3.scaleBand()
            .domain(newcurr.map(d => d.state))
            .range([0, width]);
    } else if (xVar == "state") {
        xScale = d3.scaleBand()
            .domain(newcurr.map(d => d.state))
            .range([0, width])
            .padding(0.1);
    }
    
    const xAxis = d3.axisBottom(xScale)

    yScale = d3.scaleLinear()
        .domain([Math.min(0, d3.min(newcurr, d => d.value)), Math.max(d3.max(newcurr, d => d.value))])
        .range([height, 0]);
    const yAxis = d3.axisLeft(yScale)

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
        
    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text(xVar)
        .attr('class', 'labels')

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 40)
        .attr("text-anchor", "middle")
        .text(yVar)
        .attr('class', 'labels')
}

function returnbars() {
    let currentData = allData.filter(d => +d.date === targetYear);
    currentData = d3.rollups(currentData, v => d3.mean(v, d => d[yVar]), d => d.state);
    let newcurr = [];
    for (const data of currentData) {
        newcurr.push({state: data[0], value: data[1]});
    }
    newcurr = newcurr.filter(d => !isNaN(d.value));
    newcurr.sort((x, z) => z.value - x.value);
    let i = 0;
    for (const sta of newcurr) {
        sta.rank = i + 1;
        i++;
    }
    return newcurr;
}

function returnLines() {
    let finalarr = [];
    for (const state of currstates) {
        let currentData = allData.filter(d => d.state === state);
        currentData = d3.rollups(currentData, v => d3.mean(v, d => d[yVar]), d => +d.date);
        let newcurr = [];
        for (const data of currentData) {
            newcurr.push({date: new Date(data[0]), value: data[1]});
        }
        newcurr = newcurr.filter(d => !isNaN(d.value));
        newcurr.sort((x, z) => x.date - z.date);
        finalarr.push({ state: state, value: newcurr});
    }
    return finalarr;
}

function updateVis(){
  let newcurr = returnbars();
svg.selectAll('.rects')
    .data(newcurr, d => d.state)
    .join(
        function(enter){
            return enter
            .append('rect')
            .attr('class', 'rects')
            .attr('x', (d, i) => xScale(d.state))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.value))
            .style('fill', "steelblue")
            .on("click", function (event, d) {
                if (currstates.includes(d.state)) {
                    //opencolor = currstates.indexOf(d.state);
                    currstates = currstates.filter(x => x != d.state)
                    colorCode = colorCode.filter(x => x.state != d.state)
                    d3.select(this).style("fill", "steelblue");
                } else if (currstates.length < 5) {
                    const notopen = []
                    for (const x of colorCode) {
                        notopen.push(x.color) 
                    }
                    let i = 0;
                    for (const color of colorOptions) {
                        if (notopen.includes(color)) {
                            continue;
                        } else {
                            i = colorOptions.indexOf(color);
                            break;
                        }
                    }
                    currstates.push(d.state);
                    d3.select(this).style("fill", colorOptions[i]);
                    colorCode.push({state: d.state, color: colorOptions[i]});
                }
                updateVis()
                updateLineAxes()
                updateLine()
                addLegend()
            })
            .on('mouseover', function (event, d) { 
                d3.select('#tooltip')
                    .style("display", 'block')
                    .html(`<strong>${stateNames[d.state]}</strong><br/> Value: ${d.value.toFixed(1)} Rank: ${d.rank}`)
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 28) + "px");
                d3.select(this)
                    .style('stroke', 'black')
                    .style('stroke-width', '4px')
                })
                .on("mouseout", function (event, d) {
                    d3.select('#tooltip')
                        .style('display', 'none')
                    d3.select(this)
                        .style('stroke', null)
                        .style('stroke-width', null)
        })
        },
        function(update){
            return update
            .attr('x', d => xScale(d.state))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.value))
        },
        function(exit){
            exit
            .remove()
        }
    )
}

function addLegend(){
    let size = 10
    linesvg.selectAll('.stateSquare')
    .data(colorCode, d => d.state)
        .join(
            function(enter) {
                return enter
                .append('rect')
                .attr('class', 'stateSquare')
                .attr('width', size)
                .attr('height', size)
                .attr('y', -margin.top / 2)
                .attr('x', (d, i) => i * (size + 100) + 100)
                .style("fill", d => d.color)
            },
            function(update) {
                return update
                .attr('x', (d, i) => i * (size + 100) + 100)
            },
            function(exit) {
                return exit
                .remove();
            }
        )
       
    linesvg.selectAll(".stateName")
        .data(colorCode, d => d.state)
        .join(
            function(enter) {
                return enter
                .append("text")
                .attr('class', 'stateName')
                .attr("y", -margin.top/2 + size)
                .attr("x", (d, i) => i * (size + 100) + 120)  
                .style("fill", d => d.color)
                .text(d => d.state)
                .attr("text-anchor", "left")
                .style('font-size', '13px')
            },
            function(update) {
                return update
                .attr("x", (d, i) => i * (size + 100) + 120)
            },
            function(exit) {
                return exit
                .remove();
            }
        )
}

window.addEventListener('load', init);

const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

const linesvg = d3.select('#line')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);