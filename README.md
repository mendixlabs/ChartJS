# Mendix ChartJS widget

This widget is a wrapper for the [ChartJS library](http://www.chartjs.org/).

## Configuration

The data for this widget is retrieved through a datasource microflow. The assumption here is that all aggregation of data is done in the microflow and non-persistent objects are sent back to the widget.

We suggest using the following domain model, but you can create your own as long as it matches the widget's datasource requirements.

![Datamodel suggested for use with the widget](https://github.com/mendix/ChartJS/blob/master/assets/datamodel.png)

### 1) Data Source

#### Chart Entity

The entity that the data source microflow will return to the widget.

#### Microflow

The datasource microflow that returns an object of the same entity as the Chart Entity.

#### Minimum value Y Axis

[Unused] This will let you set an attribute that is used to set the minimum value that the Y-axis starts on.

#### Maximum value Y Axis

[Unused] This will let you set an attribute that is used to set the maximum value that the Y-axis starts on.

### 2) Data Set

#### Data Set Entity

The reference set that connects the Chart Entity to Data Set or Series entity. This is used to display multiple lines/bar or in case of the Pie/Doughnut chart, it will define the different values that are shown.

#### Data Set Label

The attribute that contains the label for the dataset that is used in the tooltip and the legend.

#### Color (in Hex)

The attribute that contains the color for the dataset line/bar etc in Hexidecimal f.ex. '#1f6ab3'

#### Sorting

The attribute that contains the sorting value for the dataset. This way you can decide your dataset sorting separately from the labels.

### 3) Data Point

#### Data Point Entity

The reference (set) that connects the Data Set Entity to the Data Point Entity. This entity contains the values for each point in the dataset.
This is a reference set for the Line, Bar, StackedBar and Radar charts.
It is a reference for the Pie, Doughnut, DoubleDoughnut and Polar charts.

#### X Value Attribute

The attribute that contains the X value for the Data Point.

#### X Sorting Attribute

The attribute that contains the X sorting value for the Data Point.

#### Y Value Attribute

The attribute that contains the Y value for the Data Point.

### Behavior

#### Onclick microflow

This microflow is executed when any part of the actual chart (not the legend) is clicked and passes the dataview context object along.

### Settings

All the settings for this widget match the original ChartJS settings. The documentation for these can be found here: [ChartJS Documentation](http://www.chartjs.org/docs/).

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!