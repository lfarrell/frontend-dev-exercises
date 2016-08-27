var fs = require('fs');
var d3 = require('d3');

fs.readFile('../census.csv', 'utf8', function(e, census) {
    // Turn CSV into JSON
    var data = d3.csv.parse(census);

    var education = rolling('education_level');
    var flatten_education = flatten(education, 'education_level');
    var race = rolling('race');
    var flatten_race = flatten(race, 'race');

    var all = flatten_education.concat(flatten_race);

    fs.writeFile('munged_data.json', JSON.stringify(all, null), function(err) {
        console.log(err)
    });

    // Calculate percentage of people making above/below 50k
    function rolling(key) {
        return d3.nest()
            .key(function(d) { return d[key]; })
            .rollup(function(values) {
                return {
                    under: values.filter(function(d) {
                             return +d.over_50k === 0;
                           }).length / values.length * 100,
                    over: values.filter(function(d) {
                             return +d.over_50k === 1;
                          }).length / values.length * 100,
                    total: values.length // quick check to see if our number look reasonable
                };
            })
            .entries(data);
    }

    // Flatten the nested data back out for easier access
    function flatten(nested_group, type) {
        var flat = [];
        nested_group.forEach(function(d) {
            flat.push({
                type: type,
                key: d.key,
                under: d.values.under,
                over: d.values.over
            });
        });

        return flat;
    }
});

