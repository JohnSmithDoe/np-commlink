package np.afterwork.commlink.music;

import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
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
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "MusicPlayer")
public class MusicPlayerPlugin extends Plugin {

    private static final String PREFS = "music";
    private static final String FOLDER_KEY = "folderUri";
    private static final String[] AUDIO_EXTENSIONS = { ".mp3", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".wav" };

    private ListenableFuture<MediaController> controllerFuture;

    private interface ControllerAction {
        void run(MediaController controller) throws Exception;
    }

    @Override
    public void load() {
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
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        startActivityForResult(call, intent, "onFolderPicked");
    }

    @ActivityCallback
    private void onFolderPicked(PluginCall call, ActivityResult result) {
        Intent data = result.getData();
        Uri tree = data == null ? null : data.getData();
        if (tree == null) {
            call.resolve(new JSObject());
            return;
        }
        ContentResolver resolver = getContext().getContentResolver();
        String previous = prefs().getString(FOLDER_KEY, null);
        if (previous != null && !previous.equals(tree.toString())) {
            releaseGrant(Uri.parse(previous));
        }
        resolver.takePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        prefs().edit().putString(FOLDER_KEY, tree.toString()).apply();
        call.resolve(folderResult(tree));
    }

    @PluginMethod
    public void getFolder(PluginCall call) {
        Uri tree = grantedFolder();
        call.resolve(tree == null ? new JSObject() : folderResult(tree));
    }

    @PluginMethod
    public void listTracks(PluginCall call) {
        Uri tree = grantedFolder();
        JSArray tracks = new JSArray();
        if (tree != null) {
            List<JSObject> found = new ArrayList<>();
            collectTracks(tree, DocumentsContract.getTreeDocumentId(tree), "", found);
            found.sort(Comparator.comparing(track -> track.getString("path", "").toLowerCase(Locale.ROOT)));
            for (JSObject track : found) tracks.put(track);
        }
        JSObject result = new JSObject();
        result.put("tracks", tracks);
        call.resolve(result);
    }

    @PluginMethod
    public void setQueue(PluginCall call) {
        JSArray tracks = call.getArray("tracks", new JSArray());
        int startIndex = call.getInt("startIndex", 0);
        List<MediaItem> items = new ArrayList<>();
        try {
            for (int i = 0; i < tracks.length(); i++) items.add(mediaItemOf(tracks.getJSONObject(i)));
        } catch (JSONException e) {
            call.reject("malformed track", e);
            return;
        }
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
        if (current != null) state.put("trackUri", current.mediaId);
        return state;
    }

    private static MediaItem mediaItemOf(JSONObject track) throws JSONException {
        String uri = track.getString("uri");
        MediaMetadata metadata = new MediaMetadata.Builder().setTitle(track.optString("title", uri)).build();
        return new MediaItem.Builder().setMediaId(uri).setUri(uri).setMediaMetadata(metadata).build();
    }

    private void collectTracks(Uri tree, String parentId, String prefix, List<JSObject> into) {
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, parentId);
        String[] columns = {
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE
        };
        try (Cursor cursor = getContext().getContentResolver().query(children, columns, null, null, null)) {
            if (cursor == null) return;
            while (cursor.moveToNext()) {
                String id = cursor.getString(0);
                String name = cursor.getString(1);
                String mime = cursor.getString(2);
                String path = prefix + name;
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
                    collectTracks(tree, id, path + "/", into);
                } else if (isAudio(name, mime)) {
                    JSObject track = new JSObject();
                    track.put("uri", DocumentsContract.buildDocumentUriUsingTree(tree, id).toString());
                    track.put("title", withoutExtension(name));
                    track.put("path", path);
                    into.add(track);
                }
            }
        }
    }

    private static boolean isAudio(String name, @Nullable String mime) {
        if (mime != null && mime.startsWith("audio/")) return true;
        String lower = name.toLowerCase(Locale.ROOT);
        for (String extension : AUDIO_EXTENSIONS) if (lower.endsWith(extension)) return true;
        return false;
    }

    private static String withoutExtension(String name) {
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }

    private JSObject folderResult(Uri tree) {
        JSObject folder = new JSObject();
        folder.put("uri", tree.toString());
        folder.put("name", folderName(tree));
        JSObject result = new JSObject();
        result.put("folder", folder);
        return result;
    }

    private String folderName(Uri tree) {
        Uri root = DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
        String[] columns = { DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor cursor = getContext().getContentResolver().query(root, columns, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) return cursor.getString(0);
        }
        return tree.getLastPathSegment();
    }

    @Nullable
    private Uri grantedFolder() {
        String stored = prefs().getString(FOLDER_KEY, null);
        if (stored == null) return null;
        for (UriPermission permission : getContext().getContentResolver().getPersistedUriPermissions()) {
            if (permission.isReadPermission() && permission.getUri().toString().equals(stored)) {
                return permission.getUri();
            }
        }
        prefs().edit().remove(FOLDER_KEY).apply();
        return null;
    }

    private void releaseGrant(Uri tree) {
        try {
            getContext().getContentResolver().releasePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (SecurityException ignored) {}
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE);
    }
}
