import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'trip.dart';

class LandingPage extends StatefulWidget {
  @override
  _LandingPageState createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  Trip? activeTrip;
  bool showTripForm = false;
  bool isSimulating = false;

  void handleCreateTrip(Trip trip) {
    setState(() {
      activeTrip = trip;
      showTripForm = false;
    });
  }

  void handleStartSimulation() {
    if (activeTrip != null) {
      setState(() {
        isSimulating = true;
        activeTrip = Trip(
          name: activeTrip!.name,
          destination: activeTrip!.destination,
          participants: activeTrip!.participants,
          isSimulating: true,
        );
      });
    }
  }

  void handlePauseSimulation() {
    if (activeTrip != null) {
      setState(() {
        isSimulating = false;
        activeTrip = Trip(
          name: activeTrip!.name,
          destination: activeTrip!.destination,
          participants: activeTrip!.participants,
          isSimulating: false,
        );
      });
    }
  }

  void handleResetSimulation() {
    if (activeTrip != null) {
      setState(() {
        isSimulating = false;
        activeTrip = Trip(
          name: activeTrip!.name,
          destination: activeTrip!.destination,
          participants: activeTrip!.participants.map((p) {
            return Participant(
              id: p.id,
              name: p.name,
              role: p.role,
            );
          }).toList(),
          isSimulating: false,
          simulationStep: 0,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('MeetPoint'),
        actions: [
          if (!showTripForm && activeTrip == null)
            TextButton(
              onPressed: () => setState(() => showTripForm = true),
              child: Text('Create Trip', style: TextStyle(color: Colors.white)),
            ),
          if (activeTrip != null)
            TextButton(
              onPressed: () => setState(() => activeTrip = null),
              child: Text('End Trip', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: FlutterMap(
              options: MapOptions(
                center: LatLng(13.0827, 80.2707),
                zoom: 12,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                ),
                if (activeTrip != null)
                  MarkerLayer(
                    markers: activeTrip!.participants.map((p) {
                      return Marker(
                        point: LatLng(13.0827, 80.2707),
                        builder: (ctx) => Icon(Icons.location_pin, color: Colors.red),
                      );
                    }).toList(),
                  ),
              ],
            ),
          ),
          if (activeTrip == null && !showTripForm)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: ElevatedButton(
                onPressed: () => setState(() => showTripForm = true),
                child: Text('Create Your First Trip'),
              ),
            ),
          if (activeTrip != null)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  ElevatedButton.icon(
                    onPressed: handleStartSimulation,
                    icon: Icon(Icons.play_arrow),
                    label: Text('Start Simulation'),
                  ),
                  SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: handlePauseSimulation,
                    icon: Icon(Icons.pause),
                    label: Text('Pause Simulation'),
                  ),
                  SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: handleResetSimulation,
                    icon: Icon(Icons.restart_alt),
                    label: Text('Reset Simulation'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}