    const PRICE = 0;
    const VOL = 1;
    const maxLines = 10;
    const formatComma = d3.format(",");
    var noneSelected = true;
    var lineYear = 2019;
    var lineMode = PRICE;
    var barYear = 2019;
    var barMode = PRICE;
    var values = []; // Line graph values
    var valueDict = [];
    var yearMenu = d3.select('#yearDropdown');
    var sortMenu = d3.select('#sort');
    var yearBar = d3.select('#yearBar');
    var chartDiv = document.getElementById('map');       
    var pageWidth = window.innerWidth;
    var pageHeight = window.innerHeight;
    var totalMap = d3.map();
    var totalData = [];
    var selected = {}; // Which lines are selected

    regionColors = {}
    var regionNames = ["Albany", "Atlanta", "Baltimore/Washington", "Boise", "Boston", "Buffalo/Rochester", 
    "Charlotte", "Chicago", "Cincinnati/Dayton", "Columbus", "Dallas/Ft. Worth", "Denver", "Detroit", 
    "Grand Rapids", "Harrisburg/Scranton", "Hartford/Springfield", "Houston", "Indianapolis", "Jacksonville", 
    "Las Vegas", "Los Angeles", "Louisville", "Miami/Ft. Lauderdale", "Nashville", "New Orleans/Mobile", 
    "New York", "Orlando", "Philadelphia", "Phoenix/Tucson", "Pittsburgh", "Portland", "Raleigh/Greensboro", 
    "Richmond/Norfolk", "Roanoke", "Sacramento", "San Diego", "San Francisco", "Seattle", "Spokane", "St. Louis",
        "Syracuse", "Tampa"]
    var interval = Math.floor(parseInt('fffffe', 16)/44)
    var current = interval
    for (const [index, element] of regionNames.entries()){

        regionColors[element] = '#'.concat(current.toString(16))
        current = current + interval
    }
    regionColors['Total U.S.'] = "black"
    regionColors['Albany'] = '#05d174'
    regionColors['Atlanta'] = '#0ba2e8'

    // Create line chart
    var margin = {left: 70, right: 40, top: 50, bottom: 100};
    // var lineChartWidth = pageWidth / 2.5;
    var lineChartWidth = pageWidth / 3 ; 
    var lineChartHeight = pageHeight / 3;

    var lineChart = d3.select("#lineChart").append("svg")
        .attr('height', pageHeight / 2)
        .attr('width', pageWidth / 2)
    .append("g")
        .attr("transform", "translate(" + 60 + "," + margin.top + ")");

    var xFormat = "%b";
    var parser = d3.timeParse("%b")

// ------------- CREATE AND POPULATE MAP ------------- //
    d3.csv('csv/regionLatLong.csv', function(d){
        return{
            region: d.region,
            lat: +d.lat,
            long: +d.long
        }
    }, function(error, rows){
        addCityMarkers(rows)
    })

    d3.select('#maptip')
        .style('opacity', 0)
        .style('height', pageWidth/35 + 'px')
        .style('width', pageWidth/8 +'px')
        .style('font', (12/864)*pageWidth + "px sans-serif")
        .style('line-height', pageWidth/35 + 'px')


    selectedCities = {}
    function addCityMarkers(data){
        var mapSvg = d3.select('#map').append('svg')
        .attr('width', pageWidth /2)
        .attr('height', (pageHeight / 2) + 25 + 'px')
        .on('mousedown', mousedown)
        .on('mouseup', mouseup)
        .style('cursor', 'crosshair')
            
        function mousedown() {
            var m = d3.mouse(this);
            rect = mapSvg.append('rect')
                    .attr("x", m[0])
                    .attr("y", m[1])
                    .attr('id', 'selector')
                    .attr("height", 0)
                    .attr("width", 0);

            mapSvg.on('mousemove', mousemove);
        }


        imgWidth = pageWidth/40
        imgHeight = pageWidth/40

        function mousemove(d){
            var m = d3.mouse(this);   
            
            rect.attr("width", Math.max(0, m[0] - +rect.attr("x")))
                .attr("height", Math.max(0, m[1] - +rect.attr("y")));


        }

        function mouseup() {
            mapSvg.on("mousemove", null);
            mapSvg.select('rect').remove();

            var m = d3.mouse(this);

            const elements = document.getElementsByClassName('avoIcon');
            const elementArray = Array.from(elements)

            const mouse_end_x = m[0]
            const mouse_end_y = m[1]

            const rect_y = +rect.attr('y')
            const rect_x = +rect.attr('x')


            elementArray.map( (elem, i) => {
                    y = elem.getAttribute('y')
                    x = elem.getAttribute('x')
                    if (y > rect_y && y < mouse_end_y && x > rect_x && x < mouse_end_x){
                        cleaned = elem.getAttribute('id')
                        region = elem.getAttribute('region')

                        // console.log(cleaned)

                        if (selectedCities[region]){
                            d3.select("#" + cleaned).style('stroke-width', 0)
                                .attr('xlink:href', 'img/avocado.png')
                        } else {
                            d3.selectAll("#" + cleaned).style('stroke-width', 3)
                                .attr('xlink:href', 'img/avocadoBorder.png')
                        }

                        selectedCities[region] = !selectedCities[region]
                        if (noCitiesSelected()) {
                            noneSelected = true;
                        } else {
                            noneSelected = false;
                        }

                        d3.selectAll('input').property('checked', false);
                        updateLineChart(false)
                        updateBarChart(false)
                    }
            })
        }

        d3.json("js/us.json", function(error, us){
            const mapdiv_height = document.getElementById('map').getBoundingClientRect().height
            const mapdiv_width = document.getElementById('map').getBoundingClientRect().width

            // Create Map
            var projection = d3.geoAlbersUsa()
                .translate([pageWidth / 4 , pageHeight / 3.9])
                .fitSize([mapdiv_width, mapdiv_height / 1.2], topojson.feature(us, us.objects.states))
                .translate([mapdiv_width/2, mapdiv_height/2])
        

            var path = d3.geoPath()
                        .projection(projection);

            mapSvg.append("path")
                .attr("class", "states")
                .datum(topojson.feature(us, us.objects.states))
                .attr("d", path)
                .attr('id', 'statesmap')
            

            data.forEach(function(d){ selectedCities[d.region] = false })

            var tip = d3.select('#maptip')

            var imgWidth = pageWidth/40
            var imgHeight = pageHeight/29
            mapSvg.selectAll('img')
                .data(data)
                .enter()
                .append('svg:image')
                .attr("class", "avoIcon")
                .attr('xlink:href', 'img/avocado.png')
                .attr('x',function(d){ return projection([d.long, d.lat])[0] - (imgWidth/2)})
                .attr('y',function(d){ return projection([d.long, d.lat])[1] - (imgHeight/2)})
                .attr('region', (d) => { return d.region })
                .attr('id', (d) => { return d.region.replace(/\//g, '').replace(/\./g,'').replace(' ','') })
                .attr('width', imgWidth)
                .attr('height', imgHeight)
                .style('borderStyle', 'solid')
                .on('mouseover', function(d){ 
                    tip.style('opacity', 0.9)

                    if (d.region == "Miami/Ft. Lauderdale" || d.region == "New Orleans/Mobile"){
                        tip.style('line-height', (12/864)*pageWidth + 'px')
                    } else{
                        tip.style('line-height', pageWidth/35 + 'px')
                    }

                    imgWidth = imgWidth * 1.5
                    imgHeight = imgHeight * 1.5
                    d3.select(this)
                        .attr('x',function(d){ return projection([d.long, d.lat])[0] - (imgWidth/2)})
                        .attr('y',function(d){ return projection([d.long, d.lat])[1] - (imgHeight/2)})
                        .attr('width', imgWidth)
                        .attr('height', imgHeight)
                })
                .on('mousemove', function(d){
                    tip.html(d.region)
                        .style('left', d3.mouse(this)[0] - 10 +'px')
                        .style('top', d3.mouse(this)[1] + 50 + 'px')
                })
                .on('mouseout', function (d) { 
                    tip.style('opacity', 0)
                    imgWidth = pageWidth/40
                    imgHeight = pageHeight/29
                    d3.select(this)
                        .attr('x',function(d){ return projection([d.long, d.lat])[0] - (imgWidth/2)})
                        .attr('y',function(d){ return projection([d.long, d.lat])[1] - (imgHeight/2)})
                        .attr('width', imgWidth)
                        .attr('height', imgHeight) 
                })
                .on('click', function(d) { 
                    if (selectedCities[d.region]){
                        d3.select(this).style('stroke-width', 0)
                            .attr('xlink:href', 'img/avocado.png')
                    } else {
                        d3.select(this).style('stroke-width', 3)
                            .attr('xlink:href', 'img/avocadoBorder.png')
                    }
                    selectedCities[d.region] = !selectedCities[d.region]
                    if (noCitiesSelected()) {
                        noneSelected = true;
                    } else {
                        noneSelected = false;
                    }

                    d3.selectAll('input').property('checked', false);
                    updateLineChart(false)
                    updateBarChart(false)
                })

                // Initialize year menu
                yearMenu.append("select")
                    .attr("class", "years")
                    .selectAll('option')
                        .data([2019, 2018, 2017, 2016])
                        .enter()
                        .append('option')
                    .text(function (d) { 
                        return d; 
                    })
                    .attr("value", function (d) { 
                        return d; 
                    })
                
                yearMenu.on("change", function(d) {
                        var val = d3.select(this)
                            .select("select")
                            .property("value");
                            lineYear = val;
                        if (noCitiesSelected()) {
                            noneSelected = true;
                        }
                        updateLineChart(false);
                    });

                valBar = yearMenu.append("select")
                    .attr("id", "valBar")
                    .selectAll('option')
                        .data([{"title": "Average Price", "value": 0}, 
                                {"title": "Average Volume", "value": 1}])
                        .enter()
                        .append('option')
                    .text(function (d) { 
                        return d.title; 
                    })
                    .attr("value", function (d) { 
                        return d.value; 
                })

                yearMenu.select("#valBar").on("change", function (d) {
                    var newMode = +d3.select(this)
                            .property("value");
                    lineMode = newMode
                    updateLineChart(false)
                })

            // SETTING POSITION OF INFO DIV BECAUSE NEEDS TO KNOW THE HEIGHT OF MAPDIV
            d3.select("#info")
                .style('position', 'absolute')
                .style('left', "0px")
                .style('width', mapdiv_width + 'px')
                .style('top', mapdiv_height + 'px')
                .style('height', pageHeight/2.3 + 'px')

            toastImage = d3.select('#info').append('img')
            toastImage.attr('src', 'img/toast2wtext2.png')
                        .style('left', '30px')
                        .attr('width', '60%')
                        .attr('height', '100%')

            var clearAll = d3.select("#buttondiv").append('button')
                .attr('class', 'button')
                .attr('id', 'clearAll')
                .text("Clear All")
                .on("click", function() {
                    selected = {}; // Clear selected lines
                    for(var region in selectedCities) { 
                        selectedCities[region] = false;
                    }
                    noneSelected = true;
                    d3.select('#map').select("svg").selectAll('.avoIcon')
                        .style('stroke-width', 0)
                        .attr('xlink:href', 'img/avocado.png')
                    d3.selectAll('input').property('checked', false);
                    updateLineChart(false);
                    updateBarChart(false);
                });

            const button_height = document.getElementById('clearAll').getBoundingClientRect().height
            const button_width = document.getElementById('clearAll').getBoundingClientRect().width

        })
    }


    var regionPrices = d3.map()
    d3.csv('csv/avgAvocado.csv', function(d) {
        avgPrices = [d.janP, d.febP, d.marP, d.aprP, d.mayP, d.junP, d.julP, d.augP, d.sepP, d.octP, d.novP, d.decP]
        avgVol = [d.janV, d.febV, d.marV, d.aprV, d.mayV, d.junV, d.julV, d.augV, d.sepV, d.octV, d.novV, d.decV]
        regionPrices.set([d.region, d.year], [avgPrices, avgVol])
    }, function (error, rows) {
        // Initialize the line chart
        updateLineChart(true);
    });


    const pricesPerMonth = {}
    d3.csv('csv/pricepermonth.csv', function(d){
        pricesPerMonth[d.region] = [+d.sixone, +d.sixtwo, +d.sixthree, +d.sixfour, +d.sixfive, +d.sixsix, +d.sixsev, +d.sixeight, +d.sixnine, +d.
        sixten, +d.sixelev, +d.sixtwel, +d.sevone, +d.sevtwo, +d.sevthree, +d.sevfour, +d.sevfive, +d.sevsix, +d.sevsev, +d.sixeight, +d.sevnine, +d.sevten, +d.
        sevelev, +d.sevtwel, +d.eightone, +d.eighttwo, +d.eightthree, +d.eightfour, +d.eightfive, +d.eightsix, +d.eightssevn, +d.eighteight, +d.eightnine, +d.
        eightten, +d.eightelev, +d.eighttwel, +d.nine, +d.ninetwo, +d.ninethree, +d.ninefour, +d.ninefive, +d.ninesix, +d.ninessevn, +d.nineeight, +d.ninenine, +d.
        nineten, +d.nineelev, +d.ninetwel]
    }, function(error, rows){

        form = d3.select('#info').append('form')
                    .attr('id', "pricesform")
                    .style('display', 'inline-block')
                        .style('position', 'absolute')
                        .style('top', '2%')
                        .style('left', '65%')
        var schema = {
                fields: [
                    {name: 'House Price', type: 'text', display: 'House Price'},
                    {name: 'Year', type: 'dropdown', display: 'Year',
                        values: ['2019', '2018', '2017', '2016']
                    },
                    {name: 'Month', type: 'dropdown', display: 'Month',
                        values: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    },
                    {name: 'Region', type: 'dropdown', display: 'Region',
                        values: regionNames
                    },
                    {name: 'Avocado Price', type: 'text', display: 'Avocado Price'},
                    {name: 'Not eaten AvoToast', type: 'text', display: 'Not eaten AvoToast'}
                ]
            };


        const toastPrice = 0.10417
        var avoPrice = pricesPerMonth['Total U.S.'][47]

        var p = form.selectAll("p")
                .data(schema.fields)
                .enter()
                .append("p")
                .style('margin', '3%')
                .each(function(d){
                    var self = d3.select(this);
                    var label = self.append("label")
                        .text(d.display)
                        .style("width", "100px")
                        .style("display", "inline-block");

                    if(d.type == 'text'){
                        if (d.name == 'Avocado Price'){
                            var input = self.append("input").attr('value', avoPrice)
                                            .attr('readonly', true)
                                            .attr('id', 'avocadoprice')
                        } else if (d.name == 'Not eaten AvoToast'){
                            var input = self.append("input").attr('value', Math.round(1000000/(avoPrice + toastPrice)))
                                            .attr('readonly', true)
                                            .attr('id', 'avotoast')
                        } 
                        else {
                            var input = self.append('input').attr('id', 'houseprice').attr('value', '1000000')
                        }
                    }
                    if(d.type == 'dropdown'){
                        var select = self.append("select")
                                .attr("name", "country")
                                .attr('id', 'dropdown' + d.name)
                                .selectAll("option")
                                .data(d.values)
                                .enter()
                                .append("option")
                                .text(function(d) { return d; });

                        if (d.name = 'Month'){
                            select.property('selected', (d) => { return (d == "Dec")})
                        }
                    }
                });

        const monthToNum = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 
                            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11}
        const yeartoNum = {'2016': 0, '2017': 1, '2018': 2, '2019': 3}

        function updateAvotoast(){
            const year = d3.select('#dropdownYear').node().value
            const month = d3.select('#dropdownMonth').node().value
            const region = d3.select('#dropdownRegion').node().value
            const house = d3.select('#houseprice').node().value

            avoPrice = pricesPerMonth[region][(yeartoNum[year]*12) + monthToNum[month]]

            d3.select('#avocadoprice').attr('value', avoPrice)
            d3.select('#avotoast').attr('value', Math.round(house / (avoPrice + toastPrice)))
        }

        d3.select('#houseprice')
            .on('input', (d) => { updateAvotoast() })

        d3.select("#dropdownYear")
            .on('change', (d) => { updateAvotoast() })

        d3.select("#dropdownMonth")
            .on('change', (d) => { updateAvotoast() })

        d3.select("#dropdownRegion")
            .on('change', (d) => { updateAvotoast() })
    })

    function noCitiesSelected() {
        for(var region in selectedCities) { 
            if (selectedCities[region])
                return false;
        }
        return true;
    }   

    
// ------------------------------------------- LINE CHART -------------------------------------------- //

    var regionPrices = d3.map()
    d3.csv('csv/avgAvocado.csv', function(d) {
        avgPrices = [d.janP, d.febP, d.marP, d.aprP, d.mayP, d.junP, d.julP, d.augP, d.sepP, d.octP, d.novP, d.decP]
        avgVol = [d.janV, d.febV, d.marV, d.aprV, d.mayV, d.junV, d.julV, d.augV, d.sepV, d.octV, d.novV, d.decV]
        regionPrices.set([d.region, d.year], [avgPrices, avgVol])
    }, function (error, rows) {
        // Initialize the line chart
        updateLineChart(true);
    });

    var months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    function makeValueDict() {
        valueDict = [{"month": "jan"},
            {"month": "feb"},
            {"month": "mar"},
            {"month": "apr"},
            {"month": "may"},
            {"month": "jun"},
            {"month": "jul"},
            {"month": "aug"},
            {"month": "sep"},
            {"month": "oct"},
            {"month": "nov"},
            {"month": "dec"}]

        if (noneSelected) {
            var valuePerRegion = regionPrices.get(["Total U.S.", lineYear])[lineMode];
            valueDict.forEach(function (monthObj) {
                    monthObj["Total U.S."] = valuePerRegion[months.indexOf(monthObj.month)];
            })
        } else {
            d3.keys(selectedCities).forEach(function (d) {
                if (selectedCities[d]) {
                    var valuePerRegion = regionPrices.get([d, lineYear])[lineMode];
                    valueDict.forEach(function (monthObj) {
                        monthObj[d] = valuePerRegion[months.indexOf(monthObj.month)];
                    })
                }
            })
        }
    }

    function lineColor(region){
        return regionColors[region]
    }

    function updateLineChart(init) {
        // Getting new data    
        makeValueDict(lineYear);           
        // New title
        lineChart.select("#title").remove();
        var titleText = "🥑Average Monthly Prices (" + lineYear + ")🥑";
        if (lineMode == VOL)
            titleText = "🥑Average Monthly Volume of Avocados Sold (" + lineYear + ")🥑";

        lineChart.append("text")
                .attr('x', (lineChartWidth / 2))             
                .attr('y', 0 - (margin.top / 3))
                .attr('text-anchor', 'middle') 
                .attr('id', 'title') 
                .style('font-size', '16px')
                .text(titleText)
        
        // -------------------- Scaling -----------------------//
        var x = d3.scaleTime()
            .rangeRound([0, lineChartWidth]);
        var y = d3.scaleLinear()
            .rangeRound([lineChartHeight, 0]);

        color = d3.scaleOrdinal(d3.schemeCategory10);
        color.domain(d3.keys(valueDict[0]).filter(function(key) {
            return key !== 'month'
        }));

        values = color.domain().map(function(name) {
            return {
                name: name,
                values: valueDict.map(function(d) {
                    return {
                        date: d.month,
                        value: +d[name]
                    };
                })
            };
        });

        var numCities = values.length

        // --------------- DOMAINS ------------------ // 
        x.domain(d3.extent(valueDict, function(d) {
            return parser(d.month);
        }));

        // Offset
        var offset = 0.1
        if (lineMode == VOL) {
            offset = 10000
        }

        y.domain([d3.min(values, function(c) {
                return d3.min(c.values, function(v) {
                    return v.value;
                });
            }) - offset,
            d3.max(values, function(c) {
                return d3.max(c.values, function(v) {
                    return v.value;
                });
            })
        ]);

        // Drawing the lines
        line = d3.line()
            .x(function(d) {
                return x(parser(d.date));
            })
            .y(function(d) {
                return y(d.value);
            })
            .curve(d3.curveMonotoneX);

        if (!init) {
            d3.selectAll(".value").remove(); // Remove all elements in value
        }
        value = lineChart.selectAll(".value")
            .data(values)
            .enter().append("g")
            .attr("class", "value");

        // Add lines
        value.append("path")
            .attr("class", "line")
            .attr("d", function(d) {
                return line(d.values);
            })
            .style("stroke", function(d) {
                return lineColor(d.name)
            });
        
        // Append x axis
        if (init) {
            lineChart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + lineChartHeight + ")")
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat(xFormat)));
        }

        // Append y axis
        if (init) {
            lineChart.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(y))
                .append("text")
                .attr("id", "axisText")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .style("fill", "black")
                .text("Average Price (USD)");
        } else {
            // Redraw Y axis
            lineChart.selectAll(".y.axis")
                .transition()
                .duration(750)
                .call(d3.axisLeft(y))
            lineChart.selectAll("#axisText").remove()
            var axisText = "Average Price (USD)"
            if (lineMode == VOL)
                axisText = "Average Monthly Avocados Sold"
            lineChart.append("text")
            .attr("id", "axisText")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("fill", "black")
            .text(axisText);
        }

        // Adding dots for value point
        value.append("g").selectAll("circle")
            .data(function(d){ return d.values })
            .enter()
            .append("circle")
            .attr("r", 2)
            .attr("cx", function(dd){ return x(parser(dd.date))})
            .attr("cy", function(dd){ return y(dd.value) })
            .attr('stroke', function(d){ return (lineColor(this.parentNode.__data__.name))} )
            .attr('fill', function(d){ return (lineColor(this.parentNode.__data__.name))} )

        // Prepare tooltip
        var tip = d3.select('#priceTip')
                    tip.style('opacity', 0)
                    .style('height', pageWidth/40 + 'px')
                    .style('width', pageWidth/20 +'px')
                    .style('line-height', pageWidth/35 + 'px')

        // Add legend only if numCities is < 10
        if (numCities <= maxLines) {
            var legend = value.append('circle')
                .attr('class', 'legend')
                .datum(function (d) {
                    return {
                        name: d.name,
                        value: d.values[d.values.length - 1]
                    }
                })
                .attr("cx", lineChartWidth + 20)
                .attr("cy", function(d,i){ return i * 20; })
                .attr("r", 5)
                .style("fill", function(d){ return lineColor(d.name)})

                value.append('text')
                .attr('x', lineChartWidth + 30)
                .attr('y', function(d, i) {
                    return (i * 20);
                })
                .text(function(d) {
                    return d.name;
                })
                .attr("dy", ".35em")
                .attr("font-size", "10.5px")
                .style("fill", "black");

            // Add mouse line
            lineChart.selectAll(".mouse-over-effects").remove();
            var mouseG = lineChart.append("g")
            .attr("class", "mouse-over-effects");

            mouseG.append("path")
            .attr("class", "mouse-line")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

            var mousePerLine = mouseG.selectAll('.mouse-per-line')
                .data(values)
                .enter()
                .append("g")
                .attr("class", "mouse-per-line");

                mousePerLine.append("circle")
                .attr("r", 7)
                .style("stroke", function (d) {
                    return lineColor(d.name);
                })
                .style("fill", "none")
                .style("stroke-width", "2px")
                .style("opacity", "0");

                mousePerLine.append("text")
                    .attr("class", "hover-text")
                    .attr("dy", "-1em")
                    .attr("transform", "translate(10,3)");

            mouseG.append('svg:rect') 
            .attr('width', lineChartWidth) 
            .attr('height', lineChartHeight)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseout', function () { // on mouse out hide line, circles and text
                d3.select(".mouse-line")
                .style("opacity", "0");
                d3.selectAll(".mouse-per-line circle")
                .style("opacity", "0");
                d3.selectAll(".mouse-per-line text")
                .style("opacity", "0");
            })
            .on('mouseover', function () { // on mouse in show line, circles and text
                d3.select(".mouse-line")
                .style("opacity", "1");
                d3.selectAll(".mouse-per-line circle")
                .style("opacity", "1");
                d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");
            })
            .on('mousemove', function () { // mouse moving over canvas
                var mouse = d3.mouse(this);
                d3.selectAll(".mouse-per-line")
                .attr("transform", function (d, i) {
                    var xDate = x.invert(mouse[0]),
                    bisect = d3.bisector(function (d) { return parser(d.date); }).left;
                    idx = bisect(d.values, xDate);

                    var lineText = formatComma(y.invert(y(d.values[idx].value)).toFixed(2))
                    if (lineMode == PRICE) {
                        lineText = '$' + formatComma(y.invert(y(d.values[idx].value)).toFixed(2))
                    }
                    d3.select(this).select('text')
                    .text(lineText);

                    d3.select(".mouse-line")
                    .attr("d", function () {
                        var data = "M" + x(parser(d.values[idx].date)) + "," + lineChartHeight;
                        data += " " + x(parser(d.values[idx].date)) + "," + 0;
                        return data;
                    });
                    return "translate(" + x(parser(d.values[idx].date)) + "," + y(d.values[idx].value) + ")";
                });
            });
        } else {
            lineChart.selectAll(".mouse-over-effects").remove();
            
            // Append text to end of lines
            value.append("text")
                .attr("class", "label")
                .datum(function (d) {
                    return {
                        name: d.name,
                        value: d.values[d.values.length - 1]
                    };
                })
                .attr("transform", function (d) {
                    return "translate(" + x(parser(d.value.date)) + "," + y(d.value.value) + ")";
                })
                .attr("x", 3)
                .attr("dy", ".35em")
                .attr("font-size", "15px")
                .attr("opacity", 0)
                .text(function (d) {
                    return d.name;
                });
            
            // Hovering over each circle shows price
            var lines = d3.selectAll(".line")
            value.selectAll("circle").on("mouseover", function(d) {
                if (Object.keys(selected).length !== 0) {
                    var thisCircle = d3.select(this);
                    thisCircle.style("r", 4).style("opacity", 1)
                    var text = d.value
                    if (lineMode == PRICE) {
                        text = "$" + d.value;
                    }
                    tip.html(text)
                        .style('opacity', 1)
                        .style('left', d3.event.pageX - 80 + 'px')
                        .style('top', d3.event.pageY - 20 + 'px');
                }
            }).on("mouseout", function(d) {
                d3.select(this).style("r", 2)
                tip.style('opacity', 0)
            })

            lines.on("mouseover", function(d) {
                var myName = d.name

                //Grey out all lines except selected
                lines.style("opacity", function(d) {
                    if (d.name == myName || (d.name in selected)) {
                        return 1;
                    } 
                    return 0.2;
                }).style("stroke-width", function(d) {
                    if (d.name == myName || (d.name in selected)) {
                        return 3;
                    } 
                    return 1;
                })

                // Delete all labels except selected
                d3.selectAll(".label").attr("opacity", function(d) {
                    if (d.name == myName || (d.name in selected)) {
                        return 1;
                    } 
                    return 0;
                })

                // Grey out unselected circles too
                value.selectAll("circle")
                    .style("opacity", function(d) {
                        var parentName = this.parentNode.__data__.name;
                        if (parentName == myName || (parentName in selected)) return 1;
                        return 0.2;
                    })

                // Make current line bold
                d3.select(this).style("opacity", 1)
            }).on("click", function (d) {
                if (!(d.name in selected)) {
                    selected[d.name] = d;
                } else {
                    delete selected[d.name];
                    d3.select(this).style("stroke-width", function(d) {
                    if (d.name in selected) {
                        return 3;
                    } 
                    return 1;
                })
                }
                if (Object.keys(selected).length === 0) {
                    lines.style("opacity", 1).style("stroke-width", 1);
                    value.selectAll("circle").style("opacity", 1)
                }
            }).on("mouseout", function(d) {
                if (Object.keys(selected).length === 0) {
                    lines.style("opacity", 1).style("stroke-width", 1);
                    value.selectAll("circle").style("opacity", 1)
                    var myName = d.name;
                    d3.selectAll(".label").attr("opacity", function(d) {
                        if (d.name ==  myName || (d.name in selected)) {
                            return 1;
                        } 
                        return 0;
                    })
                }
            });
        }
    }

// -------------------------------------------- BAR CHART -------------------------------------------//
// Create bar chart

d3.csv('csv/avgTotals.csv', function(d) {
    totalMap.set([d.region, d.year], [d.avg, d.totalVol])
}, function (error, rows) {
    updateBarChart(true);
});

// Initialize bar chart
var barChart = d3.select("#barChart").append("svg")
        .attr("width", pageWidth / 2)
        .attr("height", pageHeight / 2)
        .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function createTotalData() {
    totalData = [];
    if (noneSelected) {
        regionNames.forEach(function (region) {
            totalData.push({
                region: region,
                value: +totalMap.get([region, barYear])[barMode]
            })
        })
    } else {
        regionNames.forEach(function (region) {
            if (selectedCities[region]) {
                totalData.push({
                    region: region,
                    value: +totalMap.get([region, barYear])[barMode]
                })
            }
        })
    }
}

yearBar.append("select")
    .attr("class", "years")
    .attr("id", "yearSelect")
    .selectAll('option')
        .data(["2019", "2018", "2017", "2016"])
        .enter()
        .append('option')
    .text(function (d) { 
        return d; 
    })
    .attr("value", function (d) { 
        return +d; 
    })

d3.select("#yearSelect").on("change", function(d) {
    var val = d3.select(this)
        .property("value");
        barYear = val;
    d3.selectAll('input').property('checked', false);
    updateBarChart(false)
});

valBar = yearBar.append("select")
    .attr("id", "valBar")
    .selectAll('option')
        .data([{"title": "Yearly Price", "value": 0}, 
            {"title": "Total Volume", "value": 1}])
        .enter()
        .append('option')
    .text(function (d) { 
        return d.title; 
    })
    .attr("value", function (d) { 
        return d.value; 
})

yearBar.select("#valBar").on("change", function (d) {
    var newMode = +d3.select(this)
            .property("value");
    barMode = newMode
    d3.selectAll('input').property('checked', false);
    updateBarChart(false)
})

var barChartWidth = pageWidth / 2 - margin.left - margin.right
var barChartHeight = pageHeight / 2 - margin.top - margin.bottom

function updateBarChart(init) {
    createTotalData();
    // New title
    barChart.select("#title").remove();
    var titleText = "🥑Average Yearly Volume of Avocados Sold (" + barYear + ")🥑";
    if (barMode == PRICE)
        titleText = "🥑Average Yearly Prices (" + barYear + ")🥑"; 
    barChart.append("text")
                .attr('x', (barChartWidth / 2))             
                .attr('y', 0 - (margin.top / 3))
                .attr('text-anchor', 'middle') 
                .attr('id', 'title') 
                .style('font-size', '16px')
                .text(titleText)

    var xScale = d3.scaleBand().rangeRound([0, barChartWidth]).padding(0.1);
    var yScale = d3.scaleLinear().rangeRound([barChartHeight, 0]);

    xScale.domain(totalData.map(function(d) { return d.region; }));
    var minDomain = d3.min(totalData, function(d) { return d.value; }) - 0.1
    if (barMode == VOL) {
        minDomain = 0
    }
    yScale.domain([minDomain, d3.max(totalData, function(d) { return d.value; })]);

    // Tooltip
    var tip = d3.select('#tip')
    tip.style('opacity', 0)
        .style('height', pageWidth/15 + 'px')
        .style('width', pageWidth/8 +'px')
        .style('line-height', pageWidth/35 + 'px')

    // Add the bars
    var bars;
    if (!init) {
        d3.selectAll(".bar").remove();
    }

    bars = barChart.selectAll(".bar")
        .data(totalData)
        .enter()
        .append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return xScale(d.region); })
            .attr("y", function(d) { return yScale(d.value); })
            .attr("width", xScale.bandwidth())
            .attr("height", function(d) { return barChartHeight - yScale(d.value); })
            .attr("fill", function(d) {return lineColor(d.region)})

    // Mouseover handling
    bars.on("mouseover", function(d) {
        d3.select(this).attr("opacity", 0.5) // Highlight the bar
        tip.style('opacity', 0.9); // Bring tooltip into focus
    })
    .on("mousemove", function (d) {
        var value = '$' + formatComma(d.value);
        if (barMode == VOL) {
            value = formatComma(d.value);
        }
        if (d.region == "Miami/Ft. Lauderdale" || d.region == "New Orleans/Mobile"){
            tip.style('line-height', (12/864) * pageWidth + 'px')
        } else{
            tip.style('line-height', pageWidth/35 + 'px')
        }

        tip.html(d.region + "<hr>" + value)
            .style('left', d3.event.pageX - 50 + 'px')
            .style('top', d3.event.pageY - 100 + 'px');
    })
    .on("mouseout", function(d) {
            d3.select(this).attr("opacity", 1)
            tip.style('opacity', 0)
    })
    .on("click", function(d) {
        if (totalData.length > maxLines && totalData.length != 42) {
            var myName = d.region
            var lines = d3.selectAll(".line")

            // If not in selected, add to selected
            if (!(myName in selected)) {
                var data = values.filter(function (d) {
                    if (d.name === myName) { return d.values };
                })
                selected[myName] = data[0];

                // Draw the lines and the circles
                                    //Grey out all lines except selected
                                    lines.style("opacity", function(d) {
                    if (d.name == myName || (d.name in selected)) {
                        return 1;
                    } 
                    return 0.2;
                }).style("stroke-width", function(d) {
                    if (d.name == myName || (d.name in selected)) {
                        return 3;
                    } 
                    return 1;
                })

                // Delete all labels except selected
                d3.selectAll(".label").attr("opacity", function(d) {
                    if (d.name == myName || (d.name in selected)) {
                        return 1;
                    } 
                    return 0;
                })

                // Grey out unselected circles too
                value.selectAll("circle")
                    .style("opacity", function(d) {
                        var parentName = this.parentNode.__data__.name;
                        if (parentName == myName || (parentName in selected)) return 1;
                        return 0.2;
                    })

            } else {
                delete selected[myName];
                // Reset the lines
                lines.style("stroke-width", function(d) {
                    if (d.name in selected) {
                        return 3;
                    } 
                    return 1;
                })

                if (Object.keys(selected).length === 0) {
                    lines.style("opacity", 1).style("stroke-width", 1);
                    value.selectAll("circle").style("opacity", 1)
                }
            }
        }
    });

    // Append x axis
    if (init) {
        barChart.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + barChartHeight + ")")
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(65)")
            .style("text-anchor", "start")

    } else {
        barChart.select(".axis--x")
            .attr("transform", "translate(0," + barChartHeight + ")")
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(65)")
            .style("text-anchor", "start")
    }

    // Append y axis
    var axisText = "Yearly Average Price (USD)"
    if (barMode == VOL)
        axisText = "Yearly Avocados Sold"

    if (init) {
        barChart.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("id", "axisText")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(axisText);
    } else {
            // Redraw Y axis
            barChart.selectAll(".axis--y")
                .transition()
                .duration(750)
                .call(d3.axisLeft(yScale))
            barChart.selectAll("#axisText").remove()
            barChart.append("text")
            .attr("id", "axisText")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("fill", "black")
            .text(axisText);
        }
}

sortMenu.on("change", function() {
    var xScale = d3.scaleBand().rangeRound([0, barChartWidth]).padding(0.1);
    var xScale0 = xScale.domain(totalData.sort(this.checked
    ? function(a, b) { return b.value - a.value; }
    : function(a, b) { return d3.ascending(a.region, b.region); })
    .map(function(d) { return d.region; }))
    .copy();

    barChart.selectAll(".bar")
        .sort(function(a, b) { return xScale0(a.region) - xScale0(b.region); });

    var transition = barChart.transition().duration(750);
    var delay = function(d, i) { return i * 50; };

    transition.selectAll(".bar")
            .delay(delay)
            .attr("x", function(d) { return xScale0(d.region); });

    transition.select(".axis--x")
        .call(d3.axisBottom(xScale))
        .selectAll("g")
            .delay(delay)
        .selectAll('text')
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(65)")
            .style("text-anchor", "start")
});