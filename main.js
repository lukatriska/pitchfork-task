let margin = {top: 20, right: 20, bottom: 100, left: 60},
  width = 1080 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

d3.csv("pitchfork.csv", data => {
  drawMeanScoreVsRecordNum(data);
  drawTop10Artists(data);
  drawYearsVsRecordNum(data);
  drawRatingGreaterThan(data, 8, '#genreByScore8');
  drawRatingGreaterThan(data, 2, '#genreByScore2');
});

const drawRatingGreaterThan = (_data, rating, divId) => {

  margin.left = 100;
  margin.right = 100;

  let svg = d3.select(divId).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    // .style("font-family", "Ubuntu Mono")
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  if (rating === 8) width -= margin.right;

  // format the data
  _data.forEach(d => d.score = +d.score);

  let arrByGenre = d3.nest()
    .key(d => d.genre)
    .rollup(v => ({
      count: v.length,
    }))
    .entries(_data);

  arrByGenre = arrByGenre.sort((a, b) => b.value.count - a.value.count);
  arrByGenre = arrByGenre.slice(0, 10);

  let genres = arrByGenre.map(d => d.key);
  let scores = [];
  let increment = rating === 2 ? 0.1 : 0.1;
  for (let i = rating + increment; i <= 10; i += increment) {
    scores.push(Math.round(i * 10) / 10);
  }

  let arr = [];
  for (let i in genres) {
    for (let j in scores) {
      let data2 = _data.filter(d => genres[i] === d.genre && scores[j] === d.score);

      for (let k in data2) arr.push({
        genre: genres[i],
        score: data2[k].score,
        count: data2.length
      });
    }
  }

  arr = arr.sort((a, b) => a.score - b.score);

  let x = d3.scaleBand()
    .range([0, width])
    .domain(arr.map(d => d.score))
    .padding(0.0);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .style("font-family", "Ubuntu Mono")
    .call(d3.axisBottom(x)
      .tickValues(x.domain().filter((d, i) => {
        let denominator = rating === 2 ? 1 : 0.5;
        return (d % denominator === 0);
      }))
    );

  let y = d3.scaleBand()
    .range([height, 0])
    .domain(genres)
    .padding(0.0);
  svg.append("g")
    .style("font-family", "Ubuntu Mono")
    .call(d3.axisLeft(y));

  let colorScale = d3.scaleLinear()
    .range(["#ec6e00", "#854300"])
    .domain([1, d3.max(arr, d => d.count)]);

  svg.selectAll()
    .data(arr, d => d.genre + ':' + d.score)
    .enter()
    .append("rect")
    .attr("x", d => x(d.score))
    .attr("y", d => y(d.genre))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", d => colorScale(d.count));

  // Add a legend for the color values.
  let legend = svg.selectAll(".legend")
    .data(colorScale.ticks(10).reverse())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => "translate(" + (width + 20) + "," + (20 + i * 20) + ")");

  legend.append("rect")
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", colorScale);

  legend.append("text")
    .attr("x", 26)
    .attr("y", 10)
    .attr("dy", ".35em")
    .text(d => d);
};

const drawTop10Artists = _data => {

  let artistAvgScore = d3.nest()
    .key(d => d.artist)
    .rollup(v => ({
      mean: d3.mean(v, d => d.score),
      count: v.length
    }))
    .entries(_data);

  artistAvgScore = artistAvgScore.sort((a, b) => (b.value.mean - a.value.mean) && (b.value.count - a.value.count));

  artistAvgScore = artistAvgScore.slice(0, 10);

  artistAvgScore = artistAvgScore.sort((a, b) => (b.value.mean - a.value.mean));

  let svg = d3.select("#artistTop10").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  let x = d3.scaleBand()
    .range([0, width])
    .padding(0.1);
  let y = d3.scaleLinear()
    .range([height, 0]);

  // Scale the range of the _data in the domains
  x.domain(artistAvgScore.map(d => d.key));
  y.domain([0, d3.max(artistAvgScore, d => d.value.mean)]);

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
    .data(artistAvgScore)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.key))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d.value.mean))
    .attr("height", d => height - y(d.value.mean));

  // add the x Axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .style("font-family", "Ubuntu Mono")
    .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
    .style("font-family", "Ubuntu Mono")
    .call(d3.axisLeft(y));

  // text label for the x axis
  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," +
      (height + margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .text("Artist");

  // text label for the y axis
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Mean Score");
};

const drawMeanScoreVsRecordNum = _data => {

  _data.forEach(d => {
    d.date = d.date.substring(0, 4);
  });

  let x = d3.scaleLinear()
    .range([0, width]);

  let y = d3.scaleLinear()
    .range([height, 0]);

  let color = d3.scaleOrdinal(d3.schemeCategory10);
  let xAxis = d3.axisBottom(x);
  let yAxis = d3.axisLeft(y);

  let svg = d3.select("#meanScoreVsRecordNo").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let primaryAvgScore = d3.nest()
    .key(d => d.primary)
    .key(d => d.date)
    .rollup(v => ({
      mean: d3.mean(v, d => d.score),
      count: v.length
    }))
    .entries(_data);

  let xArray = primaryAvgScore.map(d => d.values.map(d2 => d2.value.mean)).flat();
  let yArray = primaryAvgScore.map(d => d.values.map(d2 => d2.value.count)).flat();

  x.domain(d3.extent(xArray)).nice();
  y.domain(d3.extent(yArray)).nice();

  let cxArray = primaryAvgScore.map(d => d.values.map(d2 => x(d2.value.mean))).flat();
  let cyArray = primaryAvgScore.map(d => d.values.map(d2 => y(d2.value.count))).flat();

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text("Sepal Width (cm)");

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Sepal Length (cm)");

  svg.selectAll(".dot")
    .data(xArray)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 6)
    .attr("cx", (d, i) => cxArray[i])
    .attr("cy", (d, i) => cyArray[i])
    .style("fill", (d, i) => {
      let index = Math.floor(i / 21);
      if (index < 10) {
        return color(primaryAvgScore[index].key);
      }
    });

  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," +
      (height + margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .text("Mean Score");

  // text label for the y axis
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of records");
};

const drawYearsVsRecordNum = _data => {

  _data.forEach(d => {
    d.date = d.date.substring(0, 4);
  });

  let color = d3.scaleOrdinal(d3.schemeCategory10);

  let svg = d3.select("#yearVsRecordNo").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let yearScore = d3.nest()
    .key(d => d.primary)
    .key(d => d.date)
    .rollup(v => ({
      count: v.length
    }))
    .entries(_data);

  let dataReady = yearScore.map(d => ({
    name: d.key,
    values: d.values.map(d2 => ({year: d2.key, count: d2.value.count}))
  }));

  let xDomain = dataReady[0].values.map(d => +d.year);

  let yDomain = dataReady.map(d => d.values.map(d2 => d2.count)).flat();

  let x = d3.scaleLinear()
    .domain(d3.extent(xDomain))
    .range([0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format(".0f")));

  // Add Y axis
  let y = d3.scaleLinear()
    .domain(d3.extent(yDomain))
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add the lines
  let line = d3.line()
    .x(d => x(+d.year))
    .y(d => y(+d.count));
  svg.selectAll("myLines")
    .data(dataReady)
    .enter()
    .append("path")
    .attr("d", d => line(d.values))
    .attr("stroke", d => color(d.name))
    .style("stroke-width", 2)
    .style("fill", "none");

  // text label for the x axis
  svg.append("text")
    .attr("transform",
      "translate(" + (width / 2) + " ," +
      (height + margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .text("Year");

  // text label for the y axis
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of reviews");
};
