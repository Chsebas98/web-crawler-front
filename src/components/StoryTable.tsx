import type { Story } from '../types/story';

type StoryTableProps = {
  stories: Story[];
};

/** Renders stories in the exact order they were received — the backend owns sorting. */
export function StoryTable({ stories }: StoryTableProps) {
  return (
    <div className="story-table-wrapper">
      <table className="story-table">
        <caption className="sr-only">Hacker News stories</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Title</th>
            <th scope="col">Points</th>
            <th scope="col">Comments</th>
          </tr>
        </thead>
        <tbody>
          {stories.map((story) => (
            <tr key={story.number}>
              <td>{story.number}</td>
              <td>{story.title}</td>
              <td>{story.points}</td>
              <td>{story.comments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
