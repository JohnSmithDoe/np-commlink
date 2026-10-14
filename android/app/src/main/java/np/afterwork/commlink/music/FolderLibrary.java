package np.afterwork.commlink.music;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Base64;
import androidx.annotation.Nullable;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

final class FolderLibrary {

    private static final String[] AUDIO_EXTENSIONS = { ".mp3", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".wav" };

    private final Context context;

    FolderLibrary(Context context) {
        this.context = context;
    }

    void grant(Uri tree) {
        resolver().takePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }

    void release(Uri tree) {
        try {
            resolver().releasePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (SecurityException ignored) {}
    }

    boolean isGranted(Uri tree) {
        for (UriPermission permission : resolver().getPersistedUriPermissions()) {
            if (permission.isReadPermission() && permission.getUri().equals(tree)) return true;
        }
        return false;
    }

    String name(Uri tree) {
        Uri root = DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
        String[] columns = { DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor cursor = resolver().query(root, columns, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) return cursor.getString(0);
        }
        return tree.getLastPathSegment();
    }

    List<JSObject> tracks(Uri tree) {
        List<JSObject> found = new ArrayList<>();
        collect(tree, DocumentsContract.getTreeDocumentId(tree), "", found);
        found.sort(Comparator.comparing(track -> track.getString("path", "").toLowerCase(Locale.ROOT)));
        return found;
    }

    private void collect(Uri tree, String parentId, String prefix, List<JSObject> into) {
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, parentId);
        String[] columns = {
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE
        };
        try (Cursor cursor = resolver().query(children, columns, null, null, null)) {
            if (cursor == null) return;
            while (cursor.moveToNext()) {
                String id = cursor.getString(0);
                String name = cursor.getString(1);
                String mime = cursor.getString(2);
                String path = prefix + name;
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
                    collect(tree, id, path + "/", into);
                } else if (isAudio(name, mime)) {
                    into.add(track(DocumentsContract.buildDocumentUriUsingTree(tree, id), name, path));
                }
            }
        }
    }

    @Nullable
    String coverDataUrl(Uri uri) {
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(context, uri);
            byte[] picture = retriever.getEmbeddedPicture();
            if (picture == null) return null;
            return "data:" + imageMime(picture) + ";base64," + Base64.encodeToString(picture, Base64.NO_WRAP);
        } catch (RuntimeException e) {
            return null;
        } finally {
            try {
                retriever.release();
            } catch (Exception ignored) {}
        }
    }

    private static String imageMime(byte[] picture) {
        return picture.length > 3 && (picture[0] & 0xff) == 0x89 && picture[1] == 'P' ? "image/png" : "image/jpeg";
    }

    private JSObject track(Uri uri, String fileName, String path) {
        JSObject track = new JSObject();
        track.put("uri", uri.toString());
        track.put("path", path);
        track.put("title", withoutExtension(fileName));
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(context, uri);
            putTag(track, "title", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE));
            putTag(track, "artist", firstOf(
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST),
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST)
            ));
            putTag(track, "albumArtist", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST));
            putTag(track, "album", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM));
            putNumber(track, "durationMs", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));
            putNumber(track, "trackNumber", retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER));
        } catch (RuntimeException ignored) {
        } finally {
            try {
                retriever.release();
            } catch (Exception ignored) {}
        }
        return track;
    }

    private static void putTag(JSObject track, String key, @Nullable String value) {
        if (value != null && !value.isBlank()) track.put(key, value.trim());
    }

    private static void putNumber(JSObject track, String key, @Nullable String value) {
        if (value == null) return;
        String leading = value.split("/")[0].trim();
        try {
            track.put(key, Long.parseLong(leading));
        } catch (NumberFormatException ignored) {}
    }

    @Nullable
    private static String firstOf(@Nullable String first, @Nullable String second) {
        return first != null && !first.isBlank() ? first : second;
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

    private ContentResolver resolver() {
        return context.getContentResolver();
    }
}
