import { BrowserWindow } from 'electron';
import { openAsBlob } from 'fs';
import { moduleFunction, NativeBridgeModule, nativeBridgeModule } from '../module';

@nativeBridgeModule('upload')
export class UploadModule extends NativeBridgeModule {
  @moduleFunction()
  public async uploadFile(_mainWindow: BrowserWindow, activityId: string, filename: string) {
    const fileBlob = await openAsBlob(filename);
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
    const formData = new FormData();
    formData.append('file', fileBlob);
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: formData,
    });
    //curl -X PUT https://my-bucket-name.<accountid>.r2.cloudflarestorage.com/dog.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential<credential>&X-Amz-Date=<timestamp>&X-Amz-Expires=3600&X-Amz-Signature=<signature>&X-Amz-SignedHeaders=host&x-id=PutObject -F "data=@dog.png"

    console.log(res.status);
    if (res.status !== 200) {
      const txt = await res.text();
      console.log(txt);
    }
    return res.status;
  }
}
