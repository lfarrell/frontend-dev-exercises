d3.json('munged_data.json', function(data) {
    var margin = { top: 25, right: 100, bottom: 75, left: 80 };
    var height = 500 - margin.top - margin.bottom;
    var width = window.innerWidth - margin.left - margin.right;

    // Draw the charts
    build('#education', false);
    build('#race', false);
    build('#both', false);

    // Switch out charts on click
    d3.select(".btn-group").on("click", function(d) {
        var selected = d3.event.target.id;

        // Update chart header text
        var updated_text = _.capitalize(selected.split('-')[0]);
        d3.select('#both-text').text(updated_text);

        // Just go ahead and remove. In a production chart the enter exit update pattern is preferred
        d3.selectAll("#both svg").remove();
        build('#both', selected);
    });

    function build(selector, was_clicked) {
        var colors = d3.scale.category10();

        // Grab the data appropriate for the chart
        var education = data.filter(function(d) {
            return d.type === 'education_level';
        });
        var race = data.filter(function(d) {
            return d.type === 'race';
        });

        // Figure out which chart to show
        var tested = (was_clicked) ? was_clicked : selector;
        var x_data, x_text, data_type;

        if(/edu/.test(tested)) {
            data_type = education;
            x_data = [
                'Did not complete high school',
                'High school',
                'Some college',
                'Associates',
                'Bachelors',
                'Masters',
                'Doctorate',
                'Professional school'
            ];
            x_text = 'Education Level';
        } else {

            x_data = _.pluck(race, 'key').sort();
            x_text = 'Race';
            data_type = race;
        }

        // Format data for stacked bar chart
        var is_50_thousand = ['over', 'under'];
        var stack = d3.layout.stack()(is_50_thousand.map(function(c) {
            return data_type.map(function(d) {
                return {x: d.key, y: +d[c].toFixed(1)};
            });
        }));

        // Build scales for mapping data to screen
        var xScale = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);
        xScale.domain(x_data);

        var yScale = d3.scale.linear()
            .rangeRound([0, height]);
        yScale.domain([100, 0]);

        // Create chart axises
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickFormat(function(d) {
                return d + '%';
            });

        // Draw the legend
        legend(selector);

        // Draw chart axises and text
        var chart = d3.selectAll(selector).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        chart.append("g")
            .attr("class", "x axis")
            .translate([margin.left, height + margin.top])
            .call(xAxis);

        chart.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom)
            .style("text-anchor", "zs")
            .text(x_text);

        chart.append("g")
            .attr("class", "y axis")
            .translate([margin.left, margin.top])
            .call(yAxis);

        chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height/2)
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Percentage");

        // Add the stacked bars
        var layer = chart.selectAll(".layer")
            .data(stack)
            .enter().append("g")
            .attr("class", "layer")
            .style("fill", function(d, i) { return colors(i); });

        var bars = layer.selectAll("rect")
            .data(function(d) { return d; });

        bars.enter().append("rect");

        bars.attr("x", function(d) { return xScale(d.x); })
            .attr("y", function(d) { return yScale(d.y + d.y0); })
            .attr("height", function(d) { return yScale(d.y0) - yScale(d.y + d.y0); })
            .attr("width", xScale.rangeBand() - 1)
            .translate([margin.left, margin.top]);
    }


    function legend(selector) {
        // Don't add legend if one is set
        if(d3.select(selector + " .legend")[0][0] !== null) return;

        var colors = d3.scale.category10();

        // Draw the legend and figure out how much to space blocks and legend text
        var legend = d3.select(selector)
            .append("svg")
            .attr("width", 300)
            .attr("height", 55)
            .attr("class", "legend")
            .translate([75, 0]);

        var j = 0;

        legend.selectAll('g').data(['Over 50k', 'Under 50k'])
            .enter()
            .append('g').attr("width",190)
            .each(function(d) {
                var g = d3.select(this);

                g.append("rect")
                    .attr("x", j)
                    .attr("y", 15)
                    .attr("width", 10)
                    .attr("height", 10)
                    .style("fill", colors(d));

                g.append("text")
                    .attr("x", j + 15)
                    .attr("y", 25)
                    .attr("height",30)
                    .attr("width", d.length * 50)
                    .text(d);

                j += (d.length * 5) + 50;
            });
    }

});