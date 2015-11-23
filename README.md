# Mendix ChartJS widget

This [widget](https://appstore.home.mendix.com/link/app/1712/Mendix/ChartJS-Widget) is a wrapper for the [ChartJS library](http://www.chartjs.org/) and you can use it to visualize your aggregated data.

##### Available charts
| Multi Series | Single Series|
|-----|-----|
| Bar | Pie |
|Stacked Bar | Doughnut |
| Line | Polar |
| Radar | |

With the multi-series, one dataset, with its own color and label, has multiple data points.

In the single series, each dataset only contains one value.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Configuration

The data for this widget is retrieved through a datasource microflow. The assumption here is that all aggregation of data is done in the microflow and non-persistent objects are sent back to the widget.

In a nutshell, an implementation of the ChartJS widget consists of the following steps:

1. The widget invokes the datasource microflow returning a (chart entity) object to the widget.
2. The (chart) object that is returned should have dataset objects associated to it. In case of a multi series chart, a dataset should have datapoint objects associated to the dataset.
3. The widget uses this data to render the chart.

We suggest using one the following domain models, depending on which chart(s) you would like to implement. You can create your own implementation as long as it matches the widget's datasource requirements.

![Single Serie Datamodel suggested for use with the widget](https://github.com/mendix/ChartJS/blob/master/assets/singleserie_datamodel.png)


![Multi Series Datamodel suggested for use with the widget](https://github.com/mendix/ChartJS/blob/master/assets/multiseries_datamodel.png)

Considering a line chart, one dataset object represents one line. A line is drawn up out of of several datapoint objects.


Setting up a single serie chart works best if you configure the properties in the following order:
##### 1) Data Source
The data source for all charts in this widget package is a chart entity object returned by a microflow.

* `Chart Entity` - Container entity, referencing Dataset entity objects. _SingleSerieChart_ or _MultiSeriesChart_ in our example.
* `Microflow` - The datasource microflow that returns an object of the same entity as the Chart entity.
* `Total value` - Optional: Renders an additional (unstyled)HTML element containing the value of the configured attribute.

##### 2) Data Set
At least one dataset object should be associated to the chart entity object.

In case of a pie/doughnut/polar chart, a dataset object represents one "slice" (or sector) and consist of a 'label' and a 'value'.

For a line, (stacked) bar or radar chart, a dataset object represents a container for a serie of datapoints. A chart can have multiple datasets(series).

* `Data Set Entity` - The reference set that connects the Chart Entity to Data Set or Data Set Series entity.
* `Label` - Caption for sector (single serie) or serie (multi series) charts
* `Sorting` - Attribute of which the value will be used to determine the ascending sort order.
* `Fill color (in Hex)` - Attribute of which the value will be used to set the fill color in hex.
* `Highlight color (in Hex)` - Optional: Attribute of which the value will be used to set the highlight color in hex. Default: fill color
* `Reduce opacity` - Adds transparency to the fill color(opacity:0.5) and highlight color(opacity:0.75)


##### 3) Data Point (Multi series charts only)

At least one datapoint object should be associated to every dataset object.
In case of a line chart, all datapoints together will make up for one line.
In case of a bar chart, each datapoint in a serie(dataset object) will be represented by one bar. A serie(dataset) can have multiple bars(datapoints).

* `Data Point Entity` - Entity containing the values.
* `X Value` - The attribute that contains the X value for the data point.
* `X Sorting` - Attribute of which the value will determine how the datapoint will be ordered in relation to other datapoints.
* `Y Value` - The attribute that contains the Y value for the data point.

### Behavior

#### Onclick microflow

This microflow is executed when any part of the actual chart (not the legend) is clicked and passes the dataview context object along.

### (Chart specific) Settings

All the settings for this widget match the original ChartJS settings. The documentation for these can be found here: [ChartJS Documentation](http://www.chartjs.org/docs/).

