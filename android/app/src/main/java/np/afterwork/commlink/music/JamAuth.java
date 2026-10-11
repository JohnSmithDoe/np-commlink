package np.afterwork.commlink.music;

import android.net.Uri;
import androidx.annotation.Nullable;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

final class JamAuth {

    private record Credentials(Uri server, String token) {}

    private static final AtomicReference<Credentials> CURRENT = new AtomicReference<>();
    private static final AtomicBoolean REFUSED = new AtomicBoolean(false);

    private JamAuth() {}

    static void set(@Nullable String server, @Nullable String token) {
        CURRENT.set(server == null || token == null ? null : new Credentials(Uri.parse(server), token));
    }

    static Map<String, String> headersFor(Uri uri) {
        Credentials credentials = CURRENT.get();
        if (credentials == null || !sameOrigin(credentials.server(), uri)) return Map.of();
        return Map.of("Authorization", "Bearer " + credentials.token());
    }

    static void markRefused() {
        REFUSED.set(true);
    }

    static boolean consumeRefused() {
        return REFUSED.getAndSet(false);
    }

    private static boolean sameOrigin(Uri server, Uri uri) {
        return (
            server.getScheme() != null &&
            server.getScheme().equalsIgnoreCase(uri.getScheme()) &&
            server.getHost() != null &&
            server.getHost().equalsIgnoreCase(uri.getHost()) &&
            server.getPort() == uri.getPort()
        );
    }
}
