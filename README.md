# Mendix ChartJS widget

This widget is a wrapper for the [ChartJS library](http://www.chartjs.org/).

## Configuration

The data for this widget is retrieved through a datasource microflow. The assumption here is that all aggregation of data is done in the microflow and non-persistent objects are sent back to the widget.

We suggest using the following domain model, but you can create your own as long as it matches the widget's datasource requirements.

![Datamodel suggested for use with the widget](/assets/datamodel.png)

### Widget configuration

#### 1) Data Source

##### Chart Entity

##### Microflow

##### Minimum value Y Axis

##### Maximum value Y Axis

#### 2) Data Set

##### Data Set Entity

##### Data Set Label

##### Color (in Hex)

##### Sorting

#### 3) Data Point

##### Data Point Entity

##### X Value Attribute

##### X Sorting Attribute

##### Y Value Attribute

#### Behavior

##### On click microflow

##### Dataview onclick entity

##### Dataview onclick microflow

#### Settings

All the settings for this widget match the original ChartJS settings. The documentation for these can be found here: [ChartJS Documentation](http://www.chartjs.org/docs/).

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!