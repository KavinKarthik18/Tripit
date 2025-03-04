import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';

class LocationForm extends StatefulWidget {
  @override
  _LocationFormState createState() => _LocationFormState();
}

class _LocationFormState extends State<LocationForm> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _startLocationController = TextEditingController();
  final TextEditingController _destinationController = TextEditingController();

  Map<String, bool> teamMembers = {
    'Alice - New York': false,
    'Bob - San Francisco': false,
    'Charlie - Chicago': false,
    'Dave - Seattle': false,
    'Eve - Boston': false,
    'Frank - Austin': false,
    'Grace - Denver': false,
  };

  Future<Map<String, double>> _getCoordinates(String location) async {
    try {
      List<Location> locations = await locationFromAddress(location);
      return {
        'latitude': locations.first.latitude,
        'longitude': locations.first.longitude,
      };
    } catch (e) {
      print("Error: $e");
      return {'latitude': 0.0, 'longitude': 0.0};
    }
  }

  void _handleSubmit() async {
    if (_formKey.currentState!.validate()) {
      var startCoords = await _getCoordinates(_startLocationController.text);
      var destCoords = await _getCoordinates(_destinationController.text);

      print('Start Location: $startCoords');
      print('Destination: $destCoords');

      var selectedTeam = teamMembers.entries
          .where((entry) => entry.value)
          .map((entry) => entry.key)
          .toList();

      print('Selected Team Members: $selectedTeam');
    }
  }

  void _handleCancel() {
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Location Form')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _startLocationController,
                decoration: InputDecoration(labelText: 'Start Location'),
                validator: (value) => value!.isEmpty ? 'Enter a location' : null,
              ),
              SizedBox(height: 16.0),
              Text('Add Your Team:', style: TextStyle(fontWeight: FontWeight.bold)),
              ...teamMembers.keys.map((member) {
                return CheckboxListTile(
                  title: Text(member),
                  value: teamMembers[member],
                  onChanged: (bool? value) {
                    setState(() {
                      teamMembers[member] = value ?? false;
                    });
                  },
                );
              }).toList(),
              SizedBox(height: 16.0),
              TextFormField(
                controller: _destinationController,
                decoration: InputDecoration(labelText: 'Destination'),
                validator: (value) => value!.isEmpty ? 'Enter a location' : null,
              ),
              SizedBox(height: 32.0),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ElevatedButton(
                    onPressed: _handleSubmit,
                    child: Text('Submit'),
                  ),
                  OutlinedButton(
                    onPressed: _handleCancel,
                    child: Text('Cancel'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
