import { BrowserWindow } from 'electron';
import { createReadStream, statSync } from 'fs';
import { moduleFunction, NativeBridgeModule, nativeBridgeModule } from '../module';
import axios from 'axios';

@nativeBridgeModule('upload')
export class UploadModule extends NativeBridgeModule {
  @moduleFunction()
  public async uploadFile(_mainWindow: BrowserWindow, activityId: string, filename: string) {
    const stream = createReadStream(filename);
    const stats = statSync(filename);
    const fileSize = stats.size;
    const signedUrlRequest = await fetch(`${process.env.EXDOJO_API_ROOT}/api/uploader`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer magicalbanana`,
      },
      body: JSON.stringify({ slug: activityId, fileName: `${activityId}.mp4`, fileSize: 1 }),
    });
    const signedUrl = (await signedUrlRequest.json()) as { url: string };
    const url = signedUrl.url;
    console.log(url);

    const res = await axios.put(url, stream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize.toString(),
      },
    });

    //curl -X PUT https://my-bucket-name.<accountid>.r2.cloudflarestorage.com/dog.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential<credential>&X-Amz-Date=<timestamp>&X-Amz-Expires=3600&X-Amz-Signature=<signature>&X-Amz-SignedHeaders=host&x-id=PutObject -F "data=@dog.png"

    console.log(res.status);
    if (res.status !== 200) {
      const txt = await res.data;
      console.log(txt);
    }
    return res.status;
  }
}
