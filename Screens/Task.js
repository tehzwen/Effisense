import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Picker, Dimensions, YellowBox, KeyboardAvoidingView } from 'react-native';
import { NavigationEvents } from 'react-navigation';
import { Header, Icon, Overlay, Input, Button } from 'react-native-elements';
import DatePicker from 'react-native-datepicker';

YellowBox.ignoreWarnings(['Warning: componentWillReceiveProps']); //datepicker library uses deprecated call

export default class Task extends Component {
    constructor(props) {
        super();

        this.state = { confirmOverlayVisible: false, mode: "new" }

        this.getTaskTypes = this.getTaskTypes.bind(this);
        this.saveNewTask = this.saveNewTask.bind(this);
        this.loadDefaults = this.loadDefaults.bind(this);
    }

    convertDate(date) {
        year = date.getFullYear();
        month = date.getMonth() + 1;
        dt = date.getDate();

        if (dt < 10) {
            dt = '0' + dt;
        }
        if (month < 10) {
            month = '0' + month;
        }

        let currentDate = dt + '-' + month + '-' + year;
        return currentDate;
    }

    getTaskTypes() {
        let tempArr = [];
        if (this.props.navigation.state.params.db) {
            this.props.navigation.state.params.db.transaction((txn) => {
                txn.executeSql('SELECT * FROM tasktype', [], (tx, results) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let row = results.rows.item(i);
                        tempArr.push(row);
                    }
                })
            })
                .then(() => {
                    this.setState({
                        tasktypes: tempArr,
                        selectedTaskType: tempArr[0]
                    }, () => {
                        this.loadDefaults();
                    })
                })
        } else {
            console.error("Database connection error!");
        }
    }

    loadDefaults() {
        if (this.props.navigation && this.props.navigation.state.params.data) {
            let data = this.props.navigation.state.params.data;
            let newDueDate = data.duedate.split(" ");

            //match the tasktype with the preloaded data
            let tasktype;
            this.state.tasktypes.map((type, i) => {
                if (type.id === data.tasktypeid) {
                    tasktype = type;
                }
            })

            //set state based off of existing data
            this.setState({
                taskid: data.id,
                taskname: data.taskname,
                estimatedHours: data.estimatedtime.toString(),
                priority: data.priority,
                dueDate: newDueDate[0],
                assignedBy: data.assignedinitials,
                dueDateTime: data.duedatetime,
                selectedTaskType: tasktype,
                startDate: data.startdate,
                mode: "edit"
            })

        } else {
            let date = new Date();
            currentDate = this.convertDate(date);

            this.setState({ dueDate: currentDate, dueDateTime: "AM", priority: 1, startDate: currentDate + " 00:00:00" }); //set defaults of inputs
        }
    }

    saveNewTask() {
        //format time for database
        let date = this.state.dueDate;
        date += " 00:00:00"

        if (this.state.mode === "new") {
            if (this.props.navigation.state.params.db) {
                this.props.navigation.state.params.db.transaction((txn) => {
                    txn.executeSql(`INSERT INTO task (tasktypeid, taskname, duedate, startdate, estimatedtime, completed, priority, assignedinitials, duedatetime) 
                    VALUES(${this.state.selectedTaskType.id}, '${this.state.taskname}', '${date}', '${this.state.startDate}', ${parseInt(this.state.estimatedHours)}, 0, ${this.state.priority}, '${this.state.assignedBy}', '${this.state.dueDateTime}')`)
                })
                    .then(() => {
                        this.setState({ confirmOverlayVisible: true });
                    })
                    .catch((err) => {
                        console.error(err);
                    })
            }
        } else {
            if (this.props.navigation.state.params.db) {
                this.props.navigation.state.params.db.transaction((txn) => {
                    txn.executeSql(`UPDATE task SET tasktypeid=${this.state.selectedTaskType.id}, taskname='${this.state.taskname}', duedate='${date}', startdate='${this.state.startDate}', 
                    estimatedtime=${parseInt(this.state.estimatedHours)}, completed=0, priority=${this.state.priority}, assignedinitials='${this.state.assignedBy}', duedatetime='${this.state.dueDateTime}' 
                    WHERE id=${this.state.taskid}`)
                        .then(() => {
                            this.setState({ confirmOverlayVisible: true });
                        })
                        .catch((err) => {
                            console.error(err);
                        })
                })
            }
        }

    }

    // componentDidUpdate() {
    //     console.log(this.state);
    // }

    render() {

        let height = Math.round(Dimensions.get('window').height);
        let width = Math.round(Dimensions.get('window').width);

        if (this.state && this.state.tasktypes && this.state.tasktypes.length > 0 && this.state.dueDate) {
            return (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <NavigationEvents onWillFocus={() => this.getTaskTypes()} />
                    <Header
                        backgroundColor='#327ba8'
                        leftComponent={
                            <TouchableOpacity onPress={() => this.props.navigation.navigate('Home')}>
                                <Icon
                                    name="arrow-left"
                                    type='feather'
                                    color='#fff'
                                />
                            </TouchableOpacity>}
                        centerComponent={{ text: this.state.mode === "new" ? 'Create New Task' : 'Edit Task', style: { color: '#fff', fontSize: 22 } }}
                        rightComponent={null}
                    />
                    <Overlay height={height / 3} isVisible={this.state.confirmOverlayVisible}>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <View style={{ flex: 1 }}>
                                <Text>Your task has successfully been added!</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button title="Ok" onPress={() => {
                                    this.setState({ confirmOverlayVisible: false });
                                    this.props.navigation.navigate("Home")
                                }} />
                            </View>
                        </View>
                    </Overlay>
                    <View style={{ flex: 1 }}>
                        <Text style={{ marginTop: 20, marginLeft: 'auto', marginRight: 'auto' }}>Enter the details for the task below</Text>
                        <Input
                            value={this.state.taskname}
                            labelStyle={{ color: 'black' }}
                            containerStyle={{ marginTop: 20 }}
                            label="Task Name"
                            placeholder="Yay another task...."
                            onChangeText={(text) => this.setState({ taskname: text })}
                        />
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 20, marginLeft: 10 }}>Task Type</Text>
                        <Picker
                            style={{ height: 50, width: width - 20, marginLeft: 10 }}
                            selectedValue={this.state.selectedTaskType}
                            onValueChange={(itemValue, itemIndex) => this.setState({ selectedTaskType: itemValue })}>
                            {
                                this.state.tasktypes.map((task, i) => {
                                    return <Picker.Item key={i} label={task.name} value={task} />
                                })
                            }
                        </Picker>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 2 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 20, marginLeft: 10 }}>Due Date</Text>
                                <DatePicker
                                    style={{ marginLeft: 10, width: '80%', marginTop: 10 }}
                                    date={this.state.dueDate} //initial date from state
                                    mode="date" //The enum of date, datetime and time
                                    placeholder="select date"
                                    format="DD-MM-YYYY"
                                    minDate="01-01-2016"
                                    confirmBtnText="Confirm"
                                    cancelBtnText="Cancel"
                                    customStyles={{
                                        dateIcon: {
                                            position: 'absolute',
                                            left: 0,
                                            top: 4,
                                            marginLeft: 0
                                        },
                                        dateInput: {
                                            marginLeft: 36
                                        }
                                    }}
                                    onDateChange={(date) => { this.setState({ dueDate: date }) }}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 20 }}>AM/PM</Text>
                                <Picker style={{ marginTop: 10 }}
                                    selectedValue={this.state.dueDateTime}
                                    onValueChange={(itemValue, itemIndex) => this.setState({ dueDateTime: itemValue })}
                                >
                                    <Picker.Item label="AM" value="AM" />
                                    <Picker.Item label="PM" value="PM" />
                                </Picker>
                            </View>
                        </View>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 20, marginLeft: 10 }}>Priority</Text>
                        <Picker style={{ marginTop: 10 }}
                            selectedValue={this.state.priority}
                            onValueChange={(itemValue, itemIndex) => this.setState({ priority: itemValue })}
                        >
                            <Picker.Item label="ASAP" value={1} />
                            <Picker.Item label="Normal" value={2} />
                            <Picker.Item label="Low" value={3} />
                        </Picker>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    value={this.state.assignedBy}
                                    labelStyle={{ color: 'black' }}
                                    containerStyle={{ marginTop: 20 }}
                                    label="Assigned by"
                                    placeholder="Assigner's Initials"
                                    onChangeText={(text) => this.setState({ assignedBy: text })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input
                                    value={this.state.estimatedHours}
                                    style={{ flex: 1 }}
                                    labelStyle={{ color: 'black' }}
                                    containerStyle={{ marginTop: 20 }}
                                    label="Estimated Hours"
                                    placeholder="1"
                                    keyboardType='number-pad'
                                    value={this.state.estimatedHours}
                                    onChangeText={(text) => {
                                        this.setState({ estimatedHours: text.replace(/[^0-9]/g, '') })
                                    }}
                                />
                            </View>
                        </View>
                        <Button buttonStyle={{ backgroundColor: '#327ba8' }} title="Save" onPress={this.saveNewTask} />
                    </View>
                </View>
            )
        } else {
            return (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <NavigationEvents onWillFocus={() => this.getTaskTypes()} />
                    <Header
                        backgroundColor='#327ba8'
                        leftComponent={
                            <TouchableOpacity onPress={() => this.props.navigation.navigate('Home')}>
                                <Icon
                                    name="arrow-left"
                                    type='feather'
                                    color='#fff'
                                />
                            </TouchableOpacity>}
                        centerComponent={{ text: 'Create New Task', style: { color: '#fff', fontSize: 22 } }}
                        rightComponent={null}
                    />
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text>Please create task types in order to make new tasks!</Text>
                    </View>
                </View>
            )
        }
    }
}