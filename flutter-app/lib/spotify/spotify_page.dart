import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'spoti.dart';

class SpotifyPage extends StatefulWidget {
  @override
  _SpotifyPageState createState() => _SpotifyPageState();
}

class _SpotifyPageState extends State<SpotifyPage> {
  String? accessToken;
  List<dynamic> searchResults = [];
  List<Map<String, dynamic>> selectedTracks = [];
  TextEditingController searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    authenticateUser();
  }

  Future<void> authenticateUser() async {
    final auth = SpotifyAuth();
    final token = await auth.authenticate();
    setState(() {
      accessToken = token;
    });
  }

  Future<void> searchTracks(String query) async {
    if (accessToken == null) return;
    final response = await http.get(
      Uri.https('api.spotify.com', '/v1/search', {'q': query, 'type': 'track'}),
      headers: {'Authorization': 'Bearer $accessToken'},
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      setState(() {
        searchResults = json['tracks']['items'];
      });
    } else {
      print('Failed to search tracks: ${response.body}');
    }
  }

  Future<void> createPlaylist() async {
    if (accessToken == null || selectedTracks.isEmpty) return;

    // Get current user ID
    final userResponse = await http.get(
      Uri.https('api.spotify.com', '/v1/me'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );

    if (userResponse.statusCode != 200) {
      print('Failed to get user profile: ${userResponse.body}');
      return;
    }

    final userId = jsonDecode(userResponse.body)['id'];

    // Create a new playlist
    final playlistResponse = await http.post(
      Uri.https('api.spotify.com', '/v1/users/$userId/playlists'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'name': 'Riders Playlist',
        'description': 'Playlist created for the ride!',
        'public': false,
      }),
    );

    if (playlistResponse.statusCode != 201) {
      print('Failed to create playlist: ${playlistResponse.body}');
      return;
    }

    final playlistId = jsonDecode(playlistResponse.body)['id'];

    // Add tracks to the playlist
    final trackUris = selectedTracks.map((track) => track['uri']).toList();
    final addTracksResponse = await http.post(
      Uri.https('api.spotify.com', '/v1/playlists/$playlistId/tracks'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'uris': trackUris,
      }),
    );

    if (addTracksResponse.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Playlist created successfully! 🎉')),
      );
      setState(() {
        selectedTracks.clear();
      });
    } else {
      print('Failed to add tracks: ${addTracksResponse.body}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Create Spotify Playlist'),
        backgroundColor: Colors.black87,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: searchController,
              decoration: InputDecoration(
                labelText: 'Search Tracks',
                suffixIcon: IconButton(
                  icon: Icon(Icons.search),
                  onPressed: () => searchTracks(searchController.text),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: searchResults.length,
                itemBuilder: (context, index) {
                  final track = searchResults[index];
                  final isSelected = selectedTracks.contains(track);
                  return ListTile(
                    leading: Image.network(
                      track['album']['images'][0]['url'],
                      width: 50,
                      height: 50,
                      fit: BoxFit.cover,
                    ),
                    title: Text(track['name']),
                    subtitle: Text(track['artists'][0]['name']),
                    trailing: IconButton(
                      icon: Icon(
                        isSelected
                            ? Icons.check_circle
                            : Icons.add_circle_outline,
                        color: isSelected ? Colors.green : null,
                      ),
                      onPressed: () {
                        setState(() {
                          if (isSelected) {
                            selectedTracks.remove(track);
                          } else {
                            selectedTracks.add(track);
                          }
                        });
                      },
                    ),
                  );
                },
              ),
            ),
            ElevatedButton.icon(
              onPressed: createPlaylist,
              icon: Icon(Icons.playlist_add),
              label: Text('Create Playlist'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            ),
          ],
        ),
      ),
    );
  }
}