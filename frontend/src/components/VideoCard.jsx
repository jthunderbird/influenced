import { useNavigate } from 'react-router-dom';

function VideoCard({ video }) {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleClick = () => {
    navigate(`/watch/${video.id}`);
  };

  return (
    <div className="video-card" onClick={handleClick}>
      <div className="video-thumbnail-wrapper">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="video-thumbnail"
        />
        {video.duration && (
          <div className="video-duration">{video.duration}</div>
        )}
      </div>
      <div className="video-info">
        {video.isLive && <div className="live-badge">LIVE</div>}
        <h3 className="video-title">{video.title}</h3>
        <p className="video-date">{formatDate(video.publishedAt)}</p>
      </div>
    </div>
  );
}

export default VideoCard;
