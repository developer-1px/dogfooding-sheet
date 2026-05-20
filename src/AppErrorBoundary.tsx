import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  private retry = () => {
    this.setState({ failed: false })
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="app-error" role="alert">
          <strong>화면을 표시하지 못했습니다.</strong>
          <button type="button" onClick={this.retry}>다시 시도</button>
        </div>
      )
    }

    return this.props.children
  }
}
