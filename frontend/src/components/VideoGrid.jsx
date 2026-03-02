import VideoCard from './VideoCard';

function VideoGrid({ videos }) {
  if (!videos || videos.length === 0) {
    return <div className="no-content">No videos found</div>;
  }

  return (
    <div className="video-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

export default VideoGrid;
