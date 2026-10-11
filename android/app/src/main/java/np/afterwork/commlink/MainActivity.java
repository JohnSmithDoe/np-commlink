package np.afterwork.commlink;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import np.afterwork.commlink.music.MusicPlayerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MusicPlayerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
