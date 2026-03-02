import { useParams } from 'react-router-dom';

function VideoPlayer() {
  const { videoId } = useParams();

  return (
    <div className="video-player-container">
      <div className="video-player-wrapper">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}

export default VideoPlayer;
