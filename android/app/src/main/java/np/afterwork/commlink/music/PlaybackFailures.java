package np.afterwork.commlink.music;

import androidx.media3.common.PlaybackException;
import java.util.concurrent.atomic.AtomicReference;

final class PlaybackFailures {

    private static final String OTHER = "other";
    private static final AtomicReference<String> LAST = new AtomicReference<>(OTHER);

    private PlaybackFailures() {}

    static void record(PlaybackException error) {
        LAST.set(reasonOf(error));
    }

    static String consume() {
        return LAST.getAndSet(OTHER);
    }

    private static String reasonOf(PlaybackException error) {
        if (error.errorCode == PlaybackException.ERROR_CODE_IO_FILE_NOT_FOUND) return "notFound";
        if (error.errorCode == PlaybackException.ERROR_CODE_IO_NO_PERMISSION) return "noPermission";
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SecurityException) return "noPermission";
        }
        return OTHER;
    }
}
