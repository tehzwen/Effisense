import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { Header, Icon, ListItem, Overlay, Button } from 'react-native-elements';
import { NavigationEvents } from 'react-navigation';
import { ScrollView } from 'react-native-gesture-handler';

export default class HomeScreen extends Component {
    constructor(props) {
        super();
        //SQLite.DEBUG(true);
        SQLite.enablePromise(true);

        this.state = {
            taskOverlayActive: false,
            sort: "estimate",
            sortOverlayActive: false
        }

        this.completeTask = this.completeTask.bind(this);
        this.deleteTask = this.deleteTask.bind(this);
        this.sortTasks = this.sortTasks.bind(this);
    }

    formatDate(date) {
        let splitDue = date.split("-");
        let month = splitDue[1];
        let day = splitDue[0];
        let year = splitDue[2].split(" ")[0];
        return new Date(month + "/" + day + "/" + year);
    }

    completeTask() {
        if (this.state.db && this.state.selectedTask) {
            this.state.db.transaction((txn) => {
                txn.executeSql(`UPDATE task SET completed=1 WHERE id=${this.state.selectedTask.id}`, [])
            })
                .then(() => {
                    this.setState({ taskOverlayActive: false, selectedTask: null });
                    this.getActiveTasks();
                })
                .catch((err) => {
                    console.error(err);
                })
        }
    }

    deleteTask() {
        if (this.state.db && this.state.selectedTask) {
            this.state.db.transaction((txn) => {
                txn.executeSql(`DELETE FROM task WHERE id=${this.state.selectedTask.id}`, [])
            })
                .then(() => {
                    console.log("Successfully deleted task");
                    this.setState({ taskOverlayActive: false, selectedTask: null });
                    this.getActiveTasks();
                })
                .catch((err) => {
                    console.error(err);
                })
        }
    }

    //sort all the tasks based off of different categories
    sortTasks(tasks) {
        if (this.state.sort === "priority") {
            tasks.sort((a, b) => {
                return a.priority - b.priority;
            })
            this.setState({ tasks: tasks })
        } else if (this.state.sort === "type") {
            tasks.sort((a, b) => {
                return a.tasktypeid - b.tasktypeid;
            })
            this.setState({ tasks: tasks })
        } else if (this.state.sort === "dateasc") {
            tasks.sort((a, b) => {
                return this.formatDate(a.duedate) - this.formatDate(b.duedate);
            })
            this.setState({ tasks: tasks })
        } else if (this.state.sort === "datedesc") {
            tasks.sort((a, b) => {
                return this.formatDate(b.duedate) - this.formatDate(a.duedate);
            })
            this.setState({ tasks: tasks })
        } else if (this.state.sort === "estimate") {
            tasks.sort((a, b) => {
                return a.estimatedtime - b.estimatedtime;
            })
            this.setState({ tasks: tasks })
        }
    }

    getActiveTasks() {
        let tempArr = [];
        this.state.db.transaction((txn) => {
            txn.executeSql(`SELECT t.id AS id,
             tt.id as tasktypeid,
             name,
             taskname,
             priority,
             duedate,
             duedatetime,
             startdate,
             assignedinitials,
             estimatedtime
             FROM task AS t, tasktype AS tt WHERE t.tasktypeid=tt.id AND completed=0`, [], (tx, results) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let row = results.rows.item(i);
                        tempArr.push(row);
                    }
                })
        })
            .then(() => {
                this.sortTasks(tempArr);
            })
    }

    getTaskTypes() {
        let tempArr = [];
        this.state.db.transaction((txn) => {
            txn.executeSql('SELECT * FROM tasktype', [], (tx, results) => {
                for (let i = 0; i < results.rows.length; i++) {
                    let row = results.rows.item(i);
                    tempArr.push(row);
                }
            })
        })
            .then(() => {
                this.setState({
                    tasktypes: tempArr
                })
            })
    }

    errorCB(err) {
        console.log("SQL Error: " + err);
    }

    successCB() {
        console.log("SQL executed fine");
    }

    getPriorityText(priorityLevel) {
        if (priorityLevel === 1) {
            return <Text style={{ color: 'red' }} >ASAP</Text>
        } else if (priorityLevel === 2) {
            return <Text style={{ color: 'yellow' }} >Normal</Text>
        } else {
            return <Text style={{ color: 'green' }} >Low</Text>
        }
    }

    refreshPage() {
        if (this.state && this.state.db) {
            this.getTaskTypes();
            this.getActiveTasks();
        } else {
            SQLite.openDatabase({ name: 'effisense.db', createFromLocation: 1 }, this.openCB, this.errorCB)
                .then((db) => {
                    this.setState({ db }, () => {
                        this.getTaskTypes();
                        this.getActiveTasks();
                    });
                })
        }
    }

    // componentDidUpdate() {
    //     console.log(this.state);
    // }

    render() {

        let height = Math.round(Dimensions.get('window').height);
        let width = Math.round(Dimensions.get('window').width);

        if (this.state && this.state.tasks && this.state.tasks.length > 0) {
            return (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <NavigationEvents onWillFocus={() => this.refreshPage()} />
                    <Header
                        backgroundColor='#327ba8'
                        leftComponent={<TouchableOpacity onPress={() => this.setState({ sortOverlayActive: true })}>
                            <Icon
                                name="layers"
                                type='feather'
                                color='#fff'
                            />
                        </TouchableOpacity>}
                        centerComponent={<Text style={{ fontSize: 22, color: 'white' }}>Effisense</Text>}
                        rightComponent={
                            <TouchableOpacity onPress={() => this.props.navigation.navigate('TaskTypes', { db: this.state.db })}>
                                <Icon
                                    name="edit"
                                    type='feather'
                                    color='#fff'
                                />
                            </TouchableOpacity>
                        }
                    />
                    <Overlay
                        height={height / 2}
                        onBackdropPress={() => this.setState({ sortOverlayActive: false })}
                        isVisible={this.state.sortOverlayActive}>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ marginLeft: 'auto', marginRight: 'auto' }}>Sorting Categories</Text>
                            </View>
                            <View style={{ flex: 5 }}>
                                {
                                    [{ name: "Priority", value: "priority" }, { name: "Due Date (descending)", value: "datedesc" }, { name: "Due Date (ascending)", value: "dateasc" }, { name: "Type", value: "type" }, { name: "Estimated Time", value: "estimate" }].map((val, i) => {
                                        return <ListItem key={i} title={val.name} onPress={() => {

                                            this.setState({ sort: val.value, sortOverlayActive: false }, () => this.refreshPage());
                                        }} />
                                    })
                                }
                            </View>
                        </View>
                    </Overlay>
                    <Overlay
                        height={height / 3}
                        isVisible={this.state.taskOverlayActive}
                        onBackdropPress={() => this.setState({ taskOverlayActive: false, selectedTask: null })}>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16 }}>{this.state.selectedTask ? "Taskname: " + this.state.selectedTask.taskname : ""}</Text>
                                <Text style={{ fontSize: 16 }}>{this.state.selectedTask ? "Assigned by: " + this.state.selectedTask.assignedinitials : ""}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button onPress={this.completeTask} buttonStyle={{ backgroundColor: 'green' }} title="Complete" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button onPress={() => {
                                    this.props.navigation.navigate("Task", { data: this.state.selectedTask, db: this.state.db });
                                    this.setState({ taskOverlayActive: false, selectedTask: null });
                                }} buttonStyle={{ backgroundColor: '#327ba8' }} title="Edit" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button onPress={this.deleteTask} buttonStyle={{ backgroundColor: 'red' }} title="Delete" />
                            </View>
                        </View>
                    </Overlay>
                    <ScrollView style={{ flex: 2 }}>
                        {
                            this.state.tasks.map((type, i) => {
                                return <ListItem key={i} title={<Text>{type.taskname} ({this.getPriorityText(type.priority)})</Text>} subtitle={type.name} rightSubtitle={this.formatDate(type.duedate).toDateString() + " " + type.duedatetime} onPress={() => this.setState({ selectedTask: type, taskOverlayActive: true })} />
                            })
                        }
                    </ScrollView>
                    <View style={{ position: 'absolute', top: height - 100, left: width - 100 }}>
                        <TouchableOpacity onPress={() => this.props.navigation.navigate('Task', { db: this.state.db })}>
                            <Icon name="plus" type='feather' color='#327ba8' reverse />
                        </TouchableOpacity>
                    </View>
                </View>
            )
        } else {
            return (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <NavigationEvents onWillFocus={() => this.refreshPage()} />
                    <Header
                        backgroundColor='#327ba8'
                        leftComponent={null}
                        centerComponent={<Text style={{ fontSize: 22, color: 'white' }}>Effisense</Text>}
                        rightComponent={
                            <TouchableOpacity onPress={() => this.props.navigation.navigate('TaskTypes', { db: this.state.db })}>
                                <Icon
                                    name="edit"
                                    type='feather'
                                    color='#fff'
                                />
                            </TouchableOpacity>
                        }
                    />
                    <View style={{ position: 'absolute', top: height - 100, left: width - 100 }}>
                        <TouchableOpacity onPress={() => this.props.navigation.navigate('Task', { db: this.state.db })}>
                            <Icon name="plus" type='feather' color='#327ba8' reverse />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>No current tasks....</Text>
                    </View>
                </View>
            )
        }

    }
}