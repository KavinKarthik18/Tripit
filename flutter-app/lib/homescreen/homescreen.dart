import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map_heatmap/flutter_map_heatmap.dart';
import 'package:sheet/sheet.dart';
import 'package:geolocator/geolocator.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Heatmap Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  LatLng? currentLocation;
  final LatLng chennaiLocation = LatLng(13.0827, 80.2707);
  List<LatLng> heatmapData = [
    LatLng(13.0827, 80.2707),
    LatLng(13.0622, 80.2356),
    LatLng(13.1067, 80.2206),
    LatLng(13.0500, 80.2121),
    LatLng(13.1184, 80.2846),
  ];

  final List<Map<double, MaterialColor>> gradients = [
    {0.0: Colors.blue, 0.5: Colors.yellow, 1.0: Colors.red},
    {0.0: Colors.green, 0.5: Colors.purple, 1.0: Colors.red},
  ].map((gradient) => gradient.map(
    (key, value) => MapEntry(key, MaterialColor(value.value, {500: value}))
  )).toList();

  int currentGradientIndex = 0;
  bool showHeatmap = true;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Location services are not enabled
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          // Permissions are denied, handle accordingly
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        // Permissions are permanently denied, handle accordingly
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      setState(() {
        currentLocation = LatLng(position.latitude, position.longitude);
        heatmapData.add(currentLocation!);
      });
    } catch (e) {
      print("Error getting location: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(
              center: currentLocation ?? chennaiLocation,
              zoom: 14,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              ),
              if (showHeatmap)
                HeatMapLayer(
                  heatMapDataSource: InMemoryHeatMapDataSource(
                    data: heatmapData.map((latLng) => WeightedLatLng(latLng, 1.0)).toList(),
                  ),
                  heatMapOptions: HeatMapOptions(
                    gradient: gradients[currentGradientIndex],
                    minOpacity: 0.5,
                    radius: 30, 
                  ),
                ),
              MarkerLayer(
                markers: [
                  if (currentLocation != null)
                    Marker(
                      point: currentLocation!,
                      width: 80,
                      height: 80,
                      builder: (context) => Icon(
                        Icons.my_location,
                        color: Colors.blue,
                        size: 30,
                      ),
                    ),
                  ...heatmapData.map((point) => Marker(
                    point: point,
                    width: 80,
                    height: 80,
                    builder: (context) => Icon(
                      Icons.location_on,
                      color: Colors.red.withOpacity(0.7),
                      size: 30,
                    ),
                  )).toList(),
                ],
              ),
            ],
          ),
          Sheet(
            initialExtent: 100,
            minExtent: 100,
            maxExtent: MediaQuery.of(context).size.height * 0.8,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      "Explore your community",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Expanded(
                    child: ListView(
                      children: [
                        _buildListItem("Adyar Community", 150, 75),
                        _buildListItem("T Nagar Group", 200, 100),
                        _buildListItem("Anna Nagar Circle", 180, 90),
                        _buildListItem("Mylapore Network", 120, 60),
                        _buildListItem("Velachery Connect", 160, 80),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      );
  }

  Widget _buildListItem(String name, int rides, int activeMembers) {
    return ListTile(
      title: Text(name),
      subtitle: Text("Rides: $rides | Active Members: $activeMembers"),
      leading: Icon(Icons.group),
    );
  }
}
