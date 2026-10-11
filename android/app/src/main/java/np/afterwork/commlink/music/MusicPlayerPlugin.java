package np.afterwork.commlink.music;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "MusicPlayer")
public class MusicPlayerPlugin extends Plugin {

    private ListenableFuture<MediaController> controllerFuture;
    private FolderLibrary folders;

    private interface ControllerAction {
        void run(MediaController controller) throws Exception;
    }

    @Override
    public void load() {
        folders = new FolderLibrary(getContext());
        SessionToken token = new SessionToken(getContext(), new ComponentName(getContext(), PlaybackService.class));
        controllerFuture = new MediaController.Builder(getContext(), token).buildAsync();
        controllerFuture.addListener(
            () -> {
                MediaController controller = connectedController();
                if (controller == null) return;
                controller.addListener(
                    new Player.Listener() {
                        @Override
                        public void onEvents(Player player, Player.Events events) {
                            notifyListeners("stateChange", stateOf(player));
                        }

                        @Override
                        public void onPlayerError(PlaybackException error) {
                            if (JamAuth.consumeRefused()) notifyListeners("authRefused", new JSObject());
                        }
                    }
                );
            },
            ContextCompat.getMainExecutor(getContext())
        );
    }

    @Override
    protected void handleOnDestroy() {
        MediaController.releaseFuture(controllerFuture);
    }

    @PluginMethod
    public void pickFolder(PluginCall call) {
        startActivityForResult(call, new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), "onFolderPicked");
    }

    @ActivityCallback
    private void onFolderPicked(PluginCall call, ActivityResult result) {
        Intent data = result.getData();
        Uri tree = data == null ? null : data.getData();
        if (tree == null) {
            call.resolve(new JSObject());
            return;
        }
        folders.grant(tree);
        JSObject folder = new JSObject();
        folder.put("uri", tree.toString());
        folder.put("name", folders.name(tree));
        JSObject picked = new JSObject();
        picked.put("folder", folder);
        call.resolve(picked);
    }

    @PluginMethod
    public void releaseFolder(PluginCall call) {
        Uri tree = uriOf(call, "folderUri");
        if (tree != null) folders.release(tree);
        call.resolve();
    }

    @PluginMethod
    public void listTracks(PluginCall call) {
        Uri tree = uriOf(call, "folderUri");
        boolean granted = tree != null && folders.isGranted(tree);
        JSArray tracks = new JSArray();
        if (granted) {
            for (JSObject track : folders.tracks(tree)) tracks.put(track);
        }
        JSObject result = new JSObject();
        result.put("granted", granted);
        result.put("tracks", tracks);
        call.resolve(result);
    }

    @PluginMethod
    public void cover(PluginCall call) {
        Uri uri = uriOf(call, "uri");
        JSObject result = new JSObject();
        String dataUrl = uri == null ? null : folders.coverDataUrl(uri);
        if (dataUrl != null) result.put("dataUrl", dataUrl);
        call.resolve(result);
    }

    @PluginMethod
    public void setAuth(PluginCall call) {
        JamAuth.set(call.getString("server"), call.getString("token"));
        call.resolve();
    }

    @PluginMethod
    public void setQueue(PluginCall call) {
        List<MediaItem> items = mediaItemsOf(call);
        if (items == null) return;
        int startIndex = call.getInt("startIndex", 0);
        withController(
            call,
            (controller) -> {
                controller.setMediaItems(items, startIndex, 0);
                controller.prepare();
                controller.play();
            }
        );
    }

    @PluginMethod
    public void append(PluginCall call) {
        List<MediaItem> items = mediaItemsOf(call);
        if (items == null) return;
        withController(
            call,
            (controller) -> {
                controller.addMediaItems(items);
                if (controller.getPlaybackState() == Player.STATE_IDLE) controller.prepare();
            }
        );
    }

    @PluginMethod
    public void replaceUpcoming(PluginCall call) {
        List<MediaItem> items = mediaItemsOf(call);
        if (items == null) return;
        withController(
            call,
            (controller) -> {
                int from = controller.getCurrentMediaItemIndex() + 1;
                controller.removeMediaItems(from, controller.getMediaItemCount());
                controller.addMediaItems(items);
            }
        );
    }

    @PluginMethod
    public void removeAt(PluginCall call) {
        int index = call.getInt("index", -1);
        withController(
            call,
            (controller) -> {
                if (index >= 0 && index < controller.getMediaItemCount()) controller.removeMediaItem(index);
            }
        );
    }

    @PluginMethod
    public void skipTo(PluginCall call) {
        int index = call.getInt("index", 0);
        withController(
            call,
            (controller) -> {
                controller.seekToDefaultPosition(index);
                controller.play();
            }
        );
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        long position = call.getLong("positionMs", 0L);
        withController(call, (controller) -> controller.seekTo(position));
    }

    @PluginMethod
    public void setRepeat(PluginCall call) {
        String mode = call.getString("mode", "off");
        int repeat = "one".equals(mode) ? Player.REPEAT_MODE_ONE : "all".equals(mode) ? Player.REPEAT_MODE_ALL : Player.REPEAT_MODE_OFF;
        withController(call, (controller) -> controller.setRepeatMode(repeat));
    }

    @PluginMethod
    public void play(PluginCall call) {
        withController(call, Player::play);
    }

    @PluginMethod
    public void pause(PluginCall call) {
        withController(call, Player::pause);
    }

    @PluginMethod
    public void next(PluginCall call) {
        withController(call, Player::seekToNextMediaItem);
    }

    @PluginMethod
    public void previous(PluginCall call) {
        withController(call, Player::seekToPreviousMediaItem);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        withController(call, Player::stop);
    }

    @PluginMethod
    public void getState(PluginCall call) {
        controllerFuture.addListener(
            () -> {
                MediaController controller = connectedController();
                if (controller == null) call.reject("player unavailable");
                else call.resolve(stateOf(controller));
            },
            ContextCompat.getMainExecutor(getContext())
        );
    }

    @Nullable
    private static Uri uriOf(PluginCall call, String key) {
        String uri = call.getString(key);
        return uri == null ? null : Uri.parse(uri);
    }

    @Nullable
    private static List<MediaItem> mediaItemsOf(PluginCall call) {
        JSArray tracks = call.getArray("tracks", new JSArray());
        List<MediaItem> items = new ArrayList<>();
        try {
            for (int i = 0; i < tracks.length(); i++) items.add(mediaItemOf(tracks.getJSONObject(i)));
        } catch (JSONException e) {
            call.reject("malformed track", e);
            return null;
        }
        return items;
    }

    private void withController(PluginCall call, ControllerAction action) {
        controllerFuture.addListener(
            () -> {
                MediaController controller = connectedController();
                if (controller == null) {
                    call.reject("player unavailable");
                    return;
                }
                try {
                    action.run(controller);
                    call.resolve();
                } catch (Exception e) {
                    call.reject(e.getMessage(), e);
                }
            },
            ContextCompat.getMainExecutor(getContext())
        );
    }

    @Nullable
    private MediaController connectedController() {
        try {
            return controllerFuture.isDone() ? controllerFuture.get() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static JSObject stateOf(Player player) {
        JSObject state = new JSObject();
        state.put("playing", player.isPlaying());
        MediaItem current = player.getCurrentMediaItem();
        if (current != null) state.put("entryId", current.mediaId);
        state.put("positionMs", player.getCurrentPosition());
        long duration = player.getDuration();
        if (duration > 0) state.put("durationMs", duration);
        return state;
    }

    private static MediaItem mediaItemOf(JSONObject track) throws JSONException {
        String uri = track.getString("uri");
        MediaMetadata.Builder metadata = new MediaMetadata.Builder().setTitle(track.optString("title", uri));
        if (track.has("artist")) metadata.setArtist(track.getString("artist"));
        if (track.has("album")) metadata.setAlbumTitle(track.getString("album"));
        if (track.has("artworkUri")) metadata.setArtworkUri(Uri.parse(track.getString("artworkUri")));
        return new MediaItem.Builder()
            .setMediaId(track.getString("entryId"))
            .setUri(uri)
            .setMediaMetadata(metadata.build())
            .build();
    }
}
